package com.lera.connect_service.controller;

import com.lera.connect_service.entity.BlockedUser;
import com.lera.connect_service.repository.BlockedUserRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/chat/users")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class BlockUserController {

    private final BlockedUserRepository blockedUserRepository;

    @PostMapping("/block")
    public ResponseEntity<?> blockUser(
            @Valid @RequestBody Map<String, String> request,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID blockerId = ConnectSecurity.requireUserId(authUser);
        ConnectSecurity.assertActorIsSelf(authUser, request.get("blockerId"));

        String blockedRaw = request.get("blockedId");
        if (blockedRaw == null || blockedRaw.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "blockedId is required"));
        }
        UUID blockedId = ConnectSecurity.parseUuid(blockedRaw, "blockedId");
        if (blockerId.equals(blockedId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot block yourself"));
        }

        Optional<BlockedUser> existing = blockedUserRepository.findByBlockerIdAndBlockedId(blockerId, blockedId);
        if (existing.isPresent()) {
            return ResponseEntity.ok(Map.of(
                    "message", "User is already blocked",
                    "blockedAt", existing.get().getBlockedAt().toString()));
        }

        BlockedUser block = BlockedUser.builder()
                .blockerId(blockerId)
                .blockedId(blockedId)
                .blockedAt(LocalDateTime.now())
                .reason(request.get("reason"))
                .build();
        blockedUserRepository.save(block);

        return ResponseEntity.ok(Map.of(
                "message", "User blocked successfully",
                "blockedId", blockedId.toString(),
                "blockedAt", block.getBlockedAt().toString()));
    }

    @DeleteMapping("/block")
    public ResponseEntity<?> unblockUser(
            @RequestParam String blockerId,
            @RequestParam String blockedId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertActorIsSelf(authUser, blockerId);
        UUID blockerUuid = ConnectSecurity.parseUuid(blockerId, "blockerId");
        UUID blockedUuid = ConnectSecurity.parseUuid(blockedId, "blockedId");

        Optional<BlockedUser> existing = blockedUserRepository.findByBlockerIdAndBlockedId(blockerUuid, blockedUuid);
        if (existing.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "User was not blocked"));
        }
        blockedUserRepository.delete(existing.get());
        return ResponseEntity.ok(Map.of(
                "message", "User unblocked successfully",
                "unblockedId", blockedId));
    }

    @GetMapping("/{userId}/blocked")
    public ResponseEntity<?> getBlockedUsers(
            @PathVariable String userId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertQueryUserIsSelf(authUser, userId);
        UUID userUuid = ConnectSecurity.parseUuid(userId, "userId");
        List<BlockedUser> blockedUsers = blockedUserRepository.findByBlockerId(userUuid);

        List<Map<String, Object>> result = new ArrayList<>();
        for (BlockedUser block : blockedUsers) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", block.getId().toString());
            item.put("blockedUserId", block.getBlockedId().toString());
            item.put("blockedAt", block.getBlockedAt().toString());
            item.put("reason", block.getReason());
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/block/check")
    public ResponseEntity<?> checkBlocked(
            @RequestParam String blockerId,
            @RequestParam String blockedId,
            @AuthenticationPrincipal AuthUser authUser) {
        ConnectSecurity.assertActorIsSelf(authUser, blockerId);
        UUID blockerUuid = ConnectSecurity.parseUuid(blockerId, "blockerId");
        UUID blockedUuid = ConnectSecurity.parseUuid(blockedId, "blockedId");

        Optional<BlockedUser> block = blockedUserRepository.findByBlockerIdAndBlockedId(blockerUuid, blockedUuid);
        return ResponseEntity.ok(Map.of(
                "isBlocked", block.isPresent(),
                "blockedAt", block.map(b -> b.getBlockedAt().toString()).orElse(null)));
    }

    @GetMapping("/block/between")
    public ResponseEntity<?> checkBlockBetween(
            @RequestParam String user1,
            @RequestParam String user2,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID self = ConnectSecurity.requireUserId(authUser);
        UUID user1Uuid = ConnectSecurity.parseUuid(user1, "user1");
        UUID user2Uuid = ConnectSecurity.parseUuid(user2, "user2");
        if (!self.equals(user1Uuid) && !self.equals(user2Uuid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot query blocks between other users");
        }
        boolean hasBlock = blockedUserRepository.existsBlockBetweenUsers(user1Uuid, user2Uuid);
        return ResponseEntity.ok(Map.of("hasBlock", hasBlock));
    }
}
