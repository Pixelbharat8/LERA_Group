package com.lera.connect_service.storage;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ConnectAttachmentStorage {

    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
            ".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".js",
            ".jar", ".war", ".class", ".php", ".jsp", ".asp", ".aspx");

    @Value("${lera.attachments.dir:uploads/}")
    private String uploadDir;

    private Path root;

    @PostConstruct
    void init() throws IOException {
        String dir = uploadDir;
        if (!dir.endsWith("/")) {
            dir = dir + "/";
        }
        root = Paths.get(dir, "chat").toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    public String store(InputStream content, String originalFilename) throws IOException {
        String extension = sanitizeExtension(originalFilename);
        if (BLOCKED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("File extension not allowed");
        }
        String uniqueFilename = UUID.randomUUID() + extension;
        Path target = resolveFilename(uniqueFilename);
        Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
        return uniqueFilename;
    }

    public byte[] read(String filename) throws IOException {
        Path path = resolveFilename(filename);
        if (!Files.exists(path)) {
            return null;
        }
        return Files.readAllBytes(path);
    }

    public String probeContentType(String filename) throws IOException {
        return Files.probeContentType(resolveFilename(filename));
    }

    public void delete(String filename) throws IOException {
        Files.deleteIfExists(resolveFilename(filename));
    }

    public static String publicFileUrl(String filename) {
        return "/api/attachments/files/" + filename;
    }

    private Path resolveFilename(String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..") || filename.contains("/")) {
            throw new IllegalArgumentException("Invalid filename");
        }
        Path target = root.resolve(filename).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Invalid filename");
        }
        return target;
    }

    private static String sanitizeExtension(String originalFilename) {
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
}
