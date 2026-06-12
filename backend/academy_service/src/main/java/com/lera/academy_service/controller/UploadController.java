package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.storage.FileStorage;
import com.lera.academy_service.storage.StoredObject;
import com.lera.academy_service.storage.StorageProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@PreAuthorize(AcademyRoles.STAFF)
@RequiredArgsConstructor
public class UploadController {

    private final FileStorage fileStorage;
    private final StorageProperties storageProperties;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
        ".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".js",
        ".jar", ".war", ".class", ".php", ".jsp", ".asp", ".aspx"
    );

    private String sanitizeExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return "";
        }
        String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        ext = ext.replaceAll("[^a-z0-9.]", "");
        if (ext.length() > 10) {
            ext = ext.substring(0, 10);
        }
        return ext;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            StoredObject stored = storeMultipart(file);
            if (stored == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Upload rejected"));
            }
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("url", stored.publicUrl());
            response.put("filename", stored.filename());
            response.put("originalName", file.getOriginalFilename());
            response.put("size", stored.size());
            response.put("contentType", stored.contentType());
            response.put("uploadedAt", LocalDateTime.now());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            log.error("File upload failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Failed to upload file"
            ));
        }
    }

    @PostMapping("/multiple")
    public ResponseEntity<Map<String, Object>> uploadMultipleFiles(@RequestParam("files") MultipartFile[] files) {
        List<Map<String, Object>> uploadedFiles = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (MultipartFile file : files) {
            try {
                StoredObject stored = storeMultipart(file);
                if (stored == null) {
                    errors.add(file.getOriginalFilename() + ": Upload rejected");
                    continue;
                }
                Map<String, Object> fileInfo = new HashMap<>();
                fileInfo.put("url", stored.publicUrl());
                fileInfo.put("filename", stored.filename());
                fileInfo.put("originalName", file.getOriginalFilename());
                fileInfo.put("size", stored.size());
                fileInfo.put("contentType", stored.contentType());
                uploadedFiles.add(fileInfo);
            } catch (IOException e) {
                errors.add(file.getOriginalFilename() + ": Could not save file");
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", !uploadedFiles.isEmpty());
        response.put("files", uploadedFiles);
        response.put("errors", errors);
        response.put("totalUploaded", uploadedFiles.size());
        response.put("totalFailed", errors.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/image")
    public ResponseEntity<Map<String, Object>> uploadImage(@RequestParam("file") MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Only image files are allowed"
            ));
        }
        return uploadFile(file);
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteFile(@RequestParam("url") String fileUrl) {
        try {
            String storageKey = storageKeyFromUrl(fileUrl);
            if (storageKey == null || !fileStorage.isKeySafe(storageKey)) {
                log.warn("Invalid file delete path: {}", fileUrl);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Invalid file path"
                ));
            }
            fileStorage.delete(storageKey);
            log.info("File deleted: {}", storageKey);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "File deleted successfully"
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Failed to delete file"
            ));
        }
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getUploadInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("maxFileSize", MAX_FILE_SIZE);
        info.put("maxFileSizeMB", MAX_FILE_SIZE / (1024 * 1024));
        info.put("allowedTypes", ALLOWED_TYPES);
        info.put("storageBackend", storageProperties.getBackend());
        info.put("uploadPath", "/api/upload");
        return ResponseEntity.ok(info);
    }

    private StoredObject storeMultipart(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return null;
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            return null;
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            return null;
        }
        String extension = sanitizeExtension(file.getOriginalFilename());
        if (BLOCKED_EXTENSIONS.contains(extension)) {
            return null;
        }
        String uniqueFilename = UUID.randomUUID() + extension;
        String subDir = contentType.startsWith("image/") ? "images/" : "documents/";
        String storageKey = subDir + uniqueFilename;
        if (!fileStorage.isKeySafe(storageKey)) {
            return null;
        }
        return fileStorage.store(storageKey, file.getInputStream(), file.getSize(), contentType);
    }

    /** Maps client URL to storage key ({@code images/…} or {@code documents/…}). */
    private String storageKeyFromUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return null;
        }
        String path = fileUrl.trim();
        if (path.contains("..") || path.contains("~")) {
            return null;
        }
        int uploadsIdx = path.indexOf("/uploads/");
        if (uploadsIdx >= 0) {
            return path.substring(uploadsIdx + "/uploads/".length());
        }
        StorageProperties.S3 s3 = storageProperties.getS3();
        if (s3.getPublicBaseUrl() != null && !s3.getPublicBaseUrl().isBlank()) {
            String base = s3.getPublicBaseUrl().trim();
            if (base.endsWith("/")) {
                base = base.substring(0, base.length() - 1);
            }
            if (path.startsWith(base + "/")) {
                return path.substring(base.length() + 1);
            }
        }
        return null;
    }
}
