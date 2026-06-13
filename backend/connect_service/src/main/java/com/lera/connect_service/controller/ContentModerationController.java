package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ContentModerationLog;
import com.lera.connect_service.entity.ContentModerationRule;
import com.lera.connect_service.repository.ContentModerationLogRepository;
import com.lera.connect_service.repository.ContentModerationRuleRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/chat/moderation")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
public class ContentModerationController {

    private final ContentModerationLogRepository logRepository;
    private final ContentModerationRuleRepository ruleRepository;

    // Built-in profanity patterns (can be extended via rules)
    private static final List<String> DEFAULT_PROFANITY = List.of(
        "badword1", "badword2" // Placeholder - would have actual list
    );

    // Moderate a message before sending
    @PostMapping("/check")
    public ResponseEntity<?> checkContent(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            String content = (String) request.get("content");
            ConnectSecurity.assertActorIsSelf(authUser, (String) request.get("userId"));
            UUID userId = ConnectSecurity.requireUserId(authUser);
            UUID academyId = request.get("academyId") != null ? UUID.fromString((String) request.get("academyId")) : null;
            String userRole = (String) request.getOrDefault("userRole", "STUDENT");
            
            // Get applicable rules
            List<ContentModerationRule> rules = academyId != null 
                ? ruleRepository.findActiveRulesForAcademy(academyId)
                : ruleRepository.findGlobalActiveRules();
            
            // Check content against rules
            ModerationResult result = moderateContent(content, rules, userRole);
            
            if (result.hasViolation) {
                // Log the moderation
                ContentModerationLog log = ContentModerationLog.builder()
                    .messageId(request.get("messageId") != null ? UUID.fromString((String) request.get("messageId")) : UUID.randomUUID())
                    .userId(userId)
                    .conversationId(request.get("conversationId") != null ? UUID.fromString((String) request.get("conversationId")) : null)
                    .academyId(academyId)
                    .originalContent(content)
                    .filteredContent(result.filteredContent)
                    .moderationType("AUTO")
                    .status(result.shouldBlock ? "BLOCKED" : "FLAGGED")
                    .violationType(result.violationType)
                    .severity(result.severity)
                    .confidenceScore(result.confidence)
                    .detectedKeywords(String.join(",", result.detectedKeywords))
                    .actionTaken(result.shouldBlock ? "BLOCKED" : "WARNED")
                    .build();
                
                logRepository.save(log);
            }
            
            return ResponseEntity.ok(Map.of(
                "allowed", !result.shouldBlock,
                "hasViolation", result.hasViolation,
                "violationType", result.violationType != null ? result.violationType : "NONE",
                "severity", result.severity != null ? result.severity : "NONE",
                "filteredContent", result.filteredContent,
                "detectedKeywords", result.detectedKeywords,
                "message", result.shouldBlock ? "Message blocked due to policy violation" : 
                          result.hasViolation ? "Message flagged for review" : "Message approved"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Report a message
    @PostMapping("/report")
    public ResponseEntity<?> reportMessage(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            ConnectSecurity.requireUserId(authUser);
            ContentModerationLog log = ContentModerationLog.builder()
                .messageId(UUID.fromString((String) request.get("messageId")))
                .userId(ConnectSecurity.parseUuid((String) request.get("reportedUserId"), "reportedUserId"))
                .conversationId(request.get("conversationId") != null ? UUID.fromString((String) request.get("conversationId")) : null)
                .academyId(request.get("academyId") != null ? UUID.fromString((String) request.get("academyId")) : null)
                .originalContent((String) request.get("content"))
                .moderationType("REPORTED")
                .status("PENDING")
                .violationType((String) request.get("reason"))
                .severity("MEDIUM")
                .build();
            
            log = logRepository.save(log);
            
            return ResponseEntity.ok(Map.of(
                "reportId", log.getId(),
                "message", "Report submitted for review"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    // Get pending moderation queue
    @GetMapping("/queue")
    public ResponseEntity<?> getModerationQueue() {
        List<ContentModerationLog> pending = logRepository.findPendingReview();
        return ResponseEntity.ok(pending);
    }

    // Review and take action on a moderation log
    @PutMapping("/{logId}/review")
    public ResponseEntity<?> reviewModeration(
            @PathVariable UUID logId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertActorIsSelf(authUser, (String) request.get("reviewerId"));
        UUID reviewerId = ConnectSecurity.requireUserId(authUser);
        return logRepository.findById(logId)
            .map(log -> {
                log.setStatus((String) request.get("status")); // APPROVED, BLOCKED
                log.setReviewedById(reviewerId);
                log.setReviewNotes((String) request.get("notes"));
                log.setActionTaken((String) request.getOrDefault("action", "REVIEWED"));
                log.setIsFalsePositive((Boolean) request.getOrDefault("isFalsePositive", false));
                log.setReviewedAt(LocalDateTime.now());
                
                // Notify parent/teacher if needed
                if ((Boolean) request.getOrDefault("notifyParent", false)) {
                    log.setParentNotified(true);
                }
                if ((Boolean) request.getOrDefault("notifyTeacher", false)) {
                    log.setTeacherNotified(true);
                }
                
                return ResponseEntity.ok(logRepository.save(log));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // Get moderation stats for an academy
    @GetMapping("/stats/academy/{academyId}")
    public ResponseEntity<?> getAcademyStats(
            @PathVariable UUID academyId,
            @RequestParam(defaultValue = "30") int days) {
        LocalDateTime start = LocalDateTime.now().minusDays(days);
        LocalDateTime end = LocalDateTime.now();
        
        List<ContentModerationLog> logs = logRepository.findByAcademyAndDateRange(academyId, start, end);
        List<Object[]> violationStats = logRepository.getViolationStatsByAcademy(academyId);
        
        Map<String, Long> byType = new HashMap<>();
        for (Object[] row : violationStats) {
            if (row[0] != null) {
                byType.put((String) row[0], (Long) row[1]);
            }
        }
        
        long blocked = logs.stream().filter(l -> "BLOCKED".equals(l.getStatus())).count();
        long flagged = logs.stream().filter(l -> "FLAGGED".equals(l.getStatus())).count();
        
        return ResponseEntity.ok(Map.of(
            "totalIncidents", logs.size(),
            "blocked", blocked,
            "flagged", flagged,
            "byViolationType", byType,
            "period", days + " days"
        ));
    }

    // Get user violations history
    @GetMapping("/user/{userId}/history")
    public ResponseEntity<?> getUserHistory(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        if (!ConnectSecurity.isAcademyStaff(authUser)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN);
        }
        List<ContentModerationLog> violations = logRepository.findViolationsByUser(userId);
        long recentBlocks = logRepository.countBlockedByUserSince(userId, LocalDateTime.now().minusDays(30));
        
        return ResponseEntity.ok(Map.of(
            "violations", violations,
            "totalViolations", violations.size(),
            "recentBlocks", recentBlocks
        ));
    }

    // Manage moderation rules
    @PostMapping("/rules")
    public ResponseEntity<?> createRule(
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);
        try {
            ContentModerationRule rule = ContentModerationRule.builder()
                .academyId(request.get("academyId") != null ? UUID.fromString((String) request.get("academyId")) : null)
                .ruleName((String) request.get("ruleName"))
                .ruleType((String) request.getOrDefault("ruleType", "KEYWORD"))
                .pattern((String) request.get("pattern"))
                .category((String) request.get("category"))
                .action((String) request.getOrDefault("action", "FLAG"))
                .replacementText((String) request.get("replacementText"))
                .severity((String) request.getOrDefault("severity", "MEDIUM"))
                .appliesToStudents((Boolean) request.getOrDefault("appliesToStudents", true))
                .appliesToParents((Boolean) request.getOrDefault("appliesToParents", false))
                .appliesToTeachers((Boolean) request.getOrDefault("appliesToTeachers", false))
                .notifyParent((Boolean) request.getOrDefault("notifyParent", true))
                .notifyTeacher((Boolean) request.getOrDefault("notifyTeacher", true))
                .notifyAdmin((Boolean) request.getOrDefault("notifyAdmin", false))
                .isActive(true)
                .build();
            
            rule = ruleRepository.save(rule);
            return ResponseEntity.ok(rule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    @GetMapping("/rules")
    public ResponseEntity<?> getRules(@RequestParam(required = false) UUID academyId) {
        List<ContentModerationRule> rules = academyId != null 
            ? ruleRepository.findActiveRulesForAcademy(academyId)
            : ruleRepository.findGlobalActiveRules();
        return ResponseEntity.ok(rules);
    }

    @PutMapping("/rules/{ruleId}")
    public ResponseEntity<?> updateRule(
            @PathVariable UUID ruleId,
            @Valid @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertOrgWideMutation(authUser);
        return ruleRepository.findById(ruleId)
            .map(rule -> {
                if (request.containsKey("pattern")) rule.setPattern((String) request.get("pattern"));
                if (request.containsKey("action")) rule.setAction((String) request.get("action"));
                if (request.containsKey("severity")) rule.setSeverity((String) request.get("severity"));
                if (request.containsKey("isActive")) rule.setIsActive((Boolean) request.get("isActive"));
                rule.setUpdatedAt(LocalDateTime.now());
                return ResponseEntity.ok(ruleRepository.save(rule));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // Helper class for moderation result
    private static class ModerationResult {
        boolean hasViolation = false;
        boolean shouldBlock = false;
        String violationType;
        String severity;
        String filteredContent;
        double confidence = 0.0;
        List<String> detectedKeywords = new ArrayList<>();
    }

    // Helper: Moderate content against rules
    private ModerationResult moderateContent(String content, List<ContentModerationRule> rules, String userRole) {
        ModerationResult result = new ModerationResult();
        result.filteredContent = content;
        
        String lowerContent = content.toLowerCase();
        
        for (ContentModerationRule rule : rules) {
            // Check if rule applies to user role
            if ("STUDENT".equals(userRole) && !rule.getAppliesToStudents()) continue;
            if ("PARENT".equals(userRole) && !rule.getAppliesToParents()) continue;
            if ("TEACHER".equals(userRole) && !rule.getAppliesToTeachers()) continue;
            
            boolean matched = false;
            
            if ("KEYWORD".equals(rule.getRuleType())) {
                // Check keywords
                String[] keywords = rule.getPattern().split(",");
                for (String keyword : keywords) {
                    if (lowerContent.contains(keyword.trim().toLowerCase())) {
                        matched = true;
                        result.detectedKeywords.add(keyword.trim());
                    }
                }
            } else if ("REGEX".equals(rule.getRuleType())) {
                // Check regex pattern
                try {
                    Pattern pattern = Pattern.compile(rule.getPattern(), Pattern.CASE_INSENSITIVE);
                    if (pattern.matcher(content).find()) {
                        matched = true;
                        result.detectedKeywords.add("[regex match]");
                    }
                } catch (Exception e) {
                    // Invalid regex, skip
                }
            }
            
            if (matched) {
                result.hasViolation = true;
                result.violationType = rule.getCategory();
                result.severity = rule.getSeverity();
                result.confidence = 0.95;
                
                if ("BLOCK".equals(rule.getAction())) {
                    result.shouldBlock = true;
                } else if ("REPLACE".equals(rule.getAction()) && rule.getReplacementText() != null) {
                    // Replace matched content
                    for (String keyword : result.detectedKeywords) {
                        result.filteredContent = result.filteredContent.replaceAll(
                            "(?i)" + Pattern.quote(keyword), 
                            rule.getReplacementText()
                        );
                    }
                }
                
                if ("HIGH".equals(rule.getSeverity()) || "CRITICAL".equals(rule.getSeverity())) {
                    result.shouldBlock = true;
                }
            }
        }
        
        return result;
    }
}
