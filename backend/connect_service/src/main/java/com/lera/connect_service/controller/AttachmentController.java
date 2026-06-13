package com.lera.connect_service.controller;

import com.lera.connect_service.entity.ChatAttachment;
import com.lera.connect_service.repository.ChatAttachmentRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ChatAuthorizationService;
import com.lera.connect_service.security.ConnectSecurity;
import com.lera.connect_service.storage.ConnectAttachmentStorage;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/attachments")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class AttachmentController {

    private final ChatAttachmentRepository attachmentRepository;
    private final ConnectAttachmentStorage attachmentStorage;
    private final ChatAuthorizationService chatAuth;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "video/mp4", "video/webm", "video/quicktime",
            "audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain");

    @GetMapping("/message/{messageId}")
    public ResponseEntity<List<ChatAttachment>> getAttachmentsForMessage(
            @PathVariable String messageId,
            @AuthenticationPrincipal AuthUser authUser) {
        chatAuth.requireParticipantMessage(authUser, messageId);
        UUID msgId = ConnectSecurity.parseUuid(messageId, "messageId");
        return ResponseEntity.ok(attachmentRepository.findByMessageId(msgId));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "messageId", required = false) String messageId,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }
            if (file.getSize() > MAX_FILE_SIZE) {
                return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 10MB limit"));
            }
            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
                return ResponseEntity.badRequest().body(Map.of("error", "File type not allowed"));
            }

            UUID uploaderId = ConnectSecurity.requireUserId(authUser);
            if (messageId != null && !messageId.isBlank()) {
                chatAuth.requireParticipantMessage(authUser, messageId);
            }

            String uniqueFilename =
                    attachmentStorage.store(file.getInputStream(), file.getOriginalFilename());
            String fileType = resolveFileType(contentType);

            ChatAttachment attachment = new ChatAttachment();
            if (messageId != null && !messageId.isBlank()) {
                attachment.setMessageId(ConnectSecurity.parseUuid(messageId, "messageId"));
            }
            attachment.setFileName(file.getOriginalFilename());
            attachment.setFileUrl(ConnectAttachmentStorage.publicFileUrl(uniqueFilename));
            attachment.setFileType(fileType);
            attachment.setFileSize(file.getSize());
            attachment.setMimeType(contentType);
            attachment.setUploadedBy(uploaderId);
            attachment.setUploadedAt(LocalDateTime.now());

            ChatAttachment saved = attachmentRepository.save(attachment);

            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId().toString());
            response.put("fileName", saved.getFileName());
            response.put("fileUrl", saved.getFileUrl());
            response.put("fileType", saved.getFileType());
            response.put("fileSize", saved.getFileSize());
            response.put("mimeType", saved.getMimeType());
            response.put("message", "File uploaded successfully");
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload file"));
        }
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<?> getFile(
            @PathVariable String filename,
            @AuthenticationPrincipal AuthUser authUser) {
        try {
            ChatAttachment attachment = attachmentRepository
                    .findFirstByFileUrlEndingWith("/" + filename)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            chatAuth.assertCanAccessAttachment(authUser, attachment);

            byte[] fileContent = attachmentStorage.read(filename);
            if (fileContent == null) {
                return ResponseEntity.notFound().build();
            }
            String contentType = attachmentStorage.probeContentType(filename);
            MediaType mediaType = contentType != null
                    ? MediaType.parseMediaType(contentType)
                    : MediaType.APPLICATION_OCTET_STREAM;
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                    .body(fileContent);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid file path"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "An unexpected error occurred"));
        }
    }

    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<?> deleteAttachment(
            @PathVariable String attachmentId,
            @AuthenticationPrincipal AuthUser authUser) {
        UUID id = ConnectSecurity.parseUuid(attachmentId, "attachmentId");
        ChatAttachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        chatAuth.assertCanDeleteAttachment(authUser, attachment);

        String fileUrl = attachment.getFileUrl();
        if (fileUrl != null && fileUrl.contains("/files/")) {
            String filename = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);
            try {
                attachmentStorage.delete(filename);
            } catch (IOException e) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Failed to delete file"));
            }
        }
        attachmentRepository.delete(attachment);
        return ResponseEntity.ok(Map.of("message", "Attachment deleted successfully"));
    }

    private static String resolveFileType(String contentType) {
        if (contentType.startsWith("image/")) {
            return "image";
        }
        if (contentType.startsWith("video/")) {
            return "video";
        }
        if (contentType.startsWith("audio/")) {
            return "audio";
        }
        if (contentType.contains("pdf")
                || contentType.contains("document")
                || contentType.contains("spreadsheet")
                || contentType.contains("text")) {
            return "document";
        }
        return "other";
    }
}
