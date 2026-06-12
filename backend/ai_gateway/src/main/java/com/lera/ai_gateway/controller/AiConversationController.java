package com.lera.ai_gateway.controller;

import com.lera.ai_gateway.entity.AiConversation;
import com.lera.ai_gateway.repository.AiConversationRepository;
import com.lera.ai_gateway.security.AiGatewaySecurity;
import com.lera.ai_gateway.security.AuthUser;
import com.lera.ai_gateway.service.AcademyStudentAccessClient;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ai/conversations")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AiConversationController {

    private final AiConversationRepository aiConversationRepository;
    private final AcademyStudentAccessClient academyStudentAccess;

    @GetMapping
    public ResponseEntity<List<AiConversation>> getAllConversations(
            @RequestParam(required = false) UUID userId,
            Pageable pageable,
            @AuthenticationPrincipal AuthUser authUser) {
        if (userId != null) {
            UUID eff = AiGatewaySecurity.effectiveUserId(authUser, userId);
            return ResponseEntity.ok(aiConversationRepository.findByUserId(eff));
        }
        if (AiGatewaySecurity.isAcademyStaff(authUser)) {
            return ResponseEntity.ok(aiConversationRepository.findAll(pageable).getContent());
        }
        return ResponseEntity.ok(aiConversationRepository.findByUserId(AiGatewaySecurity.requireUserId(authUser)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AiConversation> getConversationById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiConversationRepository.findById(id)
                .map(row -> {
                    assertCanAccessRow(authUser, row);
                    return ResponseEntity.ok(row);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AiConversation>> getConversationsByUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID eff = AiGatewaySecurity.effectiveUserId(authUser, userId);
        return ResponseEntity.ok(aiConversationRepository.findByUserId(eff));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AiConversation>> getConversationsByStudent(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal AuthUser authUser) {
        academyStudentAccess.assertCanAccessStudentEntity(authUser, studentId);
        return ResponseEntity.ok(aiConversationRepository.findByStudentId(studentId));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<AiConversation>> getConversationsByType(
            @PathVariable String type,
            @AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertStaff(authUser);
        return ResponseEntity.ok(aiConversationRepository.findByConversationType(type));
    }

    @GetMapping("/subject/{subject}")
    public ResponseEntity<List<AiConversation>> getConversationsBySubject(
            @PathVariable String subject,
            @AuthenticationPrincipal AuthUser authUser) {
        AiGatewaySecurity.assertStaff(authUser);
        return ResponseEntity.ok(aiConversationRepository.findBySubject(subject));
    }

    @PostMapping
    public ResponseEntity<AiConversation> createConversation(
            @Valid @RequestBody AiConversation conversation,
            @AuthenticationPrincipal AuthUser authUser) {
        conversation.setUserId(AiGatewaySecurity.requireUserId(authUser));
        if (conversation.getStudentId() != null) {
            academyStudentAccess.assertCanAccessStudentEntity(authUser, conversation.getStudentId());
        }
        return ResponseEntity.ok(aiConversationRepository.save(conversation));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AiConversation> updateConversation(
            @PathVariable UUID id,
            @Valid @RequestBody AiConversation conversationDetails,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiConversationRepository.findById(id).map(conversation -> {
            assertCanAccessRow(authUser, conversation);
            if (conversationDetails.getTopic() != null) {
                conversation.setTopic(conversationDetails.getTopic());
            }
            if (conversationDetails.getSubject() != null) {
                conversation.setSubject(conversationDetails.getSubject());
            }
            if (conversationDetails.getConversationType() != null) {
                conversation.setConversationType(conversationDetails.getConversationType());
            }
            return ResponseEntity.ok(aiConversationRepository.save(conversation));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return aiConversationRepository.findById(id)
                .map(row -> {
                    assertCanAccessRow(authUser, row);
                    aiConversationRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void assertCanAccessRow(AuthUser user, AiConversation row) {
        if (row == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        if (AiGatewaySecurity.isAcademyStaff(user)) {
            return;
        }
        UUID self = AiGatewaySecurity.requireUserId(user);
        if (row.getUserId() != null && row.getUserId().equals(self)) {
            return;
        }
        if (row.getStudentId() != null) {
            academyStudentAccess.assertCanAccessStudentEntity(user, row.getStudentId());
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot access this conversation");
    }
}
