package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ContentModerationRule;
import com.lera.connect_service.repository.ContentModerationRuleRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.service.JdbcAuditWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;

@RestController
@RequestMapping("/api/content-moderation-rules")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER')")
public class ContentModerationRuleController {

    private final ContentModerationRuleRepository contentModerationRuleRepository;
    private final JdbcAuditWriter auditWriter;

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static void assertOrgWideMutate(AuthUser user) {
        if (!ConnectSecurity.isOrgWide(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Creating or changing content moderation rules requires an org-wide role");
        }
    }

    @GetMapping
    public ResponseEntity<List<ContentModerationRule>> getAll(Pageable pageable) {
        return ResponseEntity.ok(contentModerationRuleRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContentModerationRule> getById(@PathVariable UUID id) {
        return contentModerationRuleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ContentModerationRule>> getActiveRules() {
        return ResponseEntity.ok(contentModerationRuleRepository.findByIsActiveTrue());
    }

    @PostMapping
    public ResponseEntity<ContentModerationRule> create(
            @Valid @RequestBody ContentModerationRule rule,
            @AuthenticationPrincipal AuthUser authUser) {
        assertOrgWideMutate(authUser);
        ContentModerationRule saved = contentModerationRuleRepository.save(rule);
        auditWriter.log("CONTENT_MOD_RULE_CREATED", "ContentModerationRule", saved.getId(), null, null,
                "{\"ruleName\":\"" + esc(saved.getRuleName()) + "\"}");
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContentModerationRule> update(
            @PathVariable UUID id,
            @Valid @RequestBody ContentModerationRule details,
            @AuthenticationPrincipal AuthUser authUser) {
        assertOrgWideMutate(authUser);
        return contentModerationRuleRepository.findById(id).map(rule -> {
            String oldAction = rule.getAction();
            if (details.getRuleName() != null) rule.setRuleName(details.getRuleName());
            if (details.getPattern() != null) rule.setPattern(details.getPattern());
            if (details.getAction() != null) rule.setAction(details.getAction());
            if (details.getIsActive() != null) rule.setIsActive(details.getIsActive());
            ContentModerationRule saved = contentModerationRuleRepository.save(rule);
            auditWriter.log("CONTENT_MOD_RULE_UPDATED", "ContentModerationRule", id, null,
                    "{\"action\":\"" + esc(oldAction) + "\"}",
                    "{\"action\":\"" + esc(saved.getAction()) + "\"}");
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        assertOrgWideMutate(authUser);
        Optional<ContentModerationRule> opt = contentModerationRuleRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        ContentModerationRule rule = opt.get();
        auditWriter.log("CONTENT_MOD_RULE_DELETED", "ContentModerationRule", id, null,
                "{\"ruleName\":\"" + esc(rule.getRuleName()) + "\"}", null);
        contentModerationRuleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
