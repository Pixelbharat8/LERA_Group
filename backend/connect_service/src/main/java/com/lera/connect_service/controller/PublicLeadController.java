package com.lera.connect_service.controller;

import com.lera.connect_service.dto.PublicLeadRequest;
import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.stream.Collectors;

/**
 * Public (unauthenticated) lead capture for marketing site, placement quiz, and trial booking.
 * Staff CRM continues to use {@link LeadController}.
 */
@RestController
@RequestMapping("/api/public/leads")
@RequiredArgsConstructor
@Slf4j
public class PublicLeadController {

    private final LeadRepository leadRepository;
    private final NotificationService notificationService;
    private final com.lera.connect_service.service.LeadScoringService leadScoringService;
    private final ConcurrentMap<String, Deque<Long>> submissionsByClient = new ConcurrentHashMap<>();
    /** Global backstop window: bounds total public leads even if per-IP keys are evaded. */
    private final Deque<Long> globalSubmissions = new ArrayDeque<>();

    /** Comma-separated UUIDs to notify when a public lead arrives (e.g. center managers). */
    @Value("${connect.public-lead.notify-user-ids:}")
    private String notifyUserIdsRaw;

    @Value("${connect.public-lead.rate-limit.max-submissions:5}")
    private int maxLeadSubmissions;

    @Value("${connect.public-lead.rate-limit.window-seconds:600}")
    private long rateLimitWindowSeconds;

    /** Max total public leads accepted across ALL clients within the window (anti-flood backstop). */
    @Value("${connect.public-lead.rate-limit.max-global:200}")
    private int maxGlobalSubmissions;

    @PostMapping
    public ResponseEntity<Map<String, Object>> submitLead(
            @Valid @RequestBody PublicLeadRequest req,
            HttpServletRequest request) {
        String clientKey = clientKey(request);
        if (isHoneypotFilled(req)) {
            log.info("Ignored public lead honeypot submission client={}", clientKey);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Thank you — we will contact you shortly."
            ));
        }
        if (!allowSubmission(clientKey) || !allowGlobalSubmission()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many lead requests. Please try again later.");
        }

        String notes = buildNotesWithPlacement(req);
        String phone = req.getParentPhone() != null && !req.getParentPhone().isBlank()
                ? req.getParentPhone().trim()
                : "—";
        Lead lead = Lead.builder()
                .centerId(req.getCenterId())
                .parentName(stripTags(req.getParentName().trim()))
                .parentPhone(phone)
                .parentEmail(req.getParentEmail() != null ? req.getParentEmail().trim() : null)
                .studentName(stripTags(req.getStudentName() != null ? req.getStudentName().trim() : null))
                .studentAge(req.getStudentAge())
                .interestedProgramId(req.getInterestedProgramId())
                .preferredSchedule(stripTags(req.getPreferredSchedule()))
                .notes(notes == null || notes.isBlank() ? null : stripTags(notes))
                .status("NEW")
                .utmSource(req.getUtmSource() != null ? req.getUtmSource() : "website")
                .utmMedium(req.getUtmMedium())
                .utmCampaign(req.getUtmCampaign())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Duplicate detection: flag if another still-open lead shares this phone number.
        if (!"—".equals(phone)) {
            leadRepository.findByParentPhoneOrderByCreatedAtDesc(phone).stream()
                    .filter(l -> !"CONVERTED".equals(l.getStatus()) && !"LOST".equals(l.getStatus()))
                    .findFirst()
                    .ifPresent(prev -> {
                        lead.setDuplicate(true);
                        lead.setDuplicateOfLeadId(prev.getId());
                    });
        }
        // Lead scoring (hot/warm/cold)
        leadScoringService.apply(lead);

        Lead saved = leadRepository.save(lead);
        log.info("Public lead created id={} campaign={} score={} dup={}",
                saved.getId(), saved.getUtmCampaign(), saved.getScore(), saved.getDuplicate());

        List<UUID> notifyIds = parseNotifyIds();
        if (!notifyIds.isEmpty()) {
            String title = "New website lead";
            String titleVi = "Khách hàng mới từ website";
            String msg = String.format("%s · %s", saved.getParentName(), saved.getParentPhone());
            if (saved.getNotes() != null && !saved.getNotes().isBlank()) {
                String snippet = saved.getNotes().length() > 200
                        ? saved.getNotes().substring(0, 200) + "…"
                        : saved.getNotes();
                msg = msg + " — " + snippet;
            }
            for (UUID uid : notifyIds) {
                notificationService.createNotificationWithVi(uid, title, titleVi, msg, msg,
                        "info", "lead", saved.getId());
            }
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "id", saved.getId().toString(),
                "message", "Thank you — we will contact you shortly."
        ));
    }

    private boolean allowSubmission(String clientKey) {
        int max = Math.max(1, maxLeadSubmissions);
        long windowMillis = Math.max(60, rateLimitWindowSeconds) * 1000L;
        long now = System.currentTimeMillis();
        long cutoff = now - windowMillis;
        Deque<Long> submissions = submissionsByClient.computeIfAbsent(clientKey, ignored -> new ArrayDeque<>());
        synchronized (submissions) {
            while (!submissions.isEmpty() && submissions.peekFirst() < cutoff) {
                submissions.removeFirst();
            }
            if (submissions.size() >= max) {
                return false;
            }
            submissions.addLast(now);
        }
        cleanupOldRateLimitEntries(cutoff);
        return true;
    }

    private boolean allowGlobalSubmission() {
        int max = Math.max(1, maxGlobalSubmissions);
        long windowMillis = Math.max(60, rateLimitWindowSeconds) * 1000L;
        long now = System.currentTimeMillis();
        long cutoff = now - windowMillis;
        synchronized (globalSubmissions) {
            while (!globalSubmissions.isEmpty() && globalSubmissions.peekFirst() < cutoff) {
                globalSubmissions.removeFirst();
            }
            if (globalSubmissions.size() >= max) {
                return false;
            }
            globalSubmissions.addLast(now);
        }
        return true;
    }

    private void cleanupOldRateLimitEntries(long cutoff) {
        if (submissionsByClient.size() < 1_000) {
            return;
        }
        submissionsByClient.entrySet().removeIf(entry -> {
            Deque<Long> submissions = entry.getValue();
            synchronized (submissions) {
                while (!submissions.isEmpty() && submissions.peekFirst() < cutoff) {
                    submissions.removeFirst();
                }
                return submissions.isEmpty();
            }
        });
    }

    /**
     * Defensive strip of HTML/script from public-submitted free text before it is stored and
     * later rendered in the staff CRM (prevents stored XSS via the public lead form). These are
     * plain-text fields, so removing tag markup is lossless for legitimate input.
     */
    private static String stripTags(String value) {
        if (value == null) {
            return null;
        }
        return value.replaceAll("<[^>]*>", "").replace("<", "").replace(">", "").trim();
    }

    private static boolean isHoneypotFilled(PublicLeadRequest req) {
        return req.getWebsite() != null && !req.getWebsite().isBlank();
    }

    private static String clientKey(HttpServletRequest request) {
        // X-Forwarded-For is a client-supplied list that the trusted reverse proxy (NGINX)
        // APPENDS the real TCP source to. The leftmost entries are attacker-controllable, so
        // we take the RIGHTMOST entry — the IP observed by our proxy — which cannot be spoofed
        // by the client. Using the leftmost entry let attackers rotate the header to bypass
        // the per-IP rate limit.
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String[] hops = forwardedFor.split(",");
            String last = hops[hops.length - 1].trim();
            if (!last.isEmpty()) {
                return last;
            }
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr == null || remoteAddr.isBlank() ? "unknown" : remoteAddr;
    }

    /** Merges informal placement quiz fields into notes so CRM can filter before StudentSkillLevel exists. */
    private static String buildNotesWithPlacement(PublicLeadRequest req) {
        String base = req.getNotes() != null ? req.getNotes().trim() : "";
        StringBuilder p = new StringBuilder();
        if (req.getPlacementScoreOutOf16() != null) {
            p.append("[placement] scoreOutOf16=").append(req.getPlacementScoreOutOf16()).append("/16");
        }
        if (req.getPlacementTrackEn() != null && !req.getPlacementTrackEn().isBlank()) {
            if (p.length() > 0) {
                p.append("; ");
            }
            p.append("trackEn=").append(req.getPlacementTrackEn().trim());
        }
        if (req.getPlacementTrackVi() != null && !req.getPlacementTrackVi().isBlank()) {
            if (p.length() > 0) {
                p.append("; ");
            }
            p.append("trackVi=").append(req.getPlacementTrackVi().trim());
        }
        if (req.getPlacementCefrOrBand() != null && !req.getPlacementCefrOrBand().isBlank()) {
            if (p.length() > 0) {
                p.append("; ");
            }
            p.append("band=").append(req.getPlacementCefrOrBand().trim());
        }
        if (p.length() == 0) {
            return base.isEmpty() ? null : base;
        }
        if (base.isEmpty()) {
            return p.toString();
        }
        return p + "\n" + base;
    }

    private List<UUID> parseNotifyIds() {
        if (notifyUserIdsRaw == null || notifyUserIdsRaw.isBlank()) {
            return List.of();
        }
        return Arrays.stream(notifyUserIdsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(UUID::fromString)
                .collect(Collectors.toList());
    }
}
