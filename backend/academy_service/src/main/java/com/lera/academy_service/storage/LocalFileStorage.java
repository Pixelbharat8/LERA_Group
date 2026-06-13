package com.lera.academy_service.storage;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "lera.storage.backend", havingValue = "local", matchIfMissing = true)
public class LocalFileStorage implements FileStorage {

    private final StorageProperties properties;
    private Path root;

    public LocalFileStorage(StorageProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    void init() throws IOException {
        String dir = properties.getLocalDir();
        if (dir == null || dir.isBlank()) {
            dir = System.getProperty("user.dir") + "/uploads/";
        }
        if (!dir.endsWith("/")) {
            dir = dir + "/";
        }
        root = Paths.get(dir).toAbsolutePath().normalize();
        Files.createDirectories(root.resolve("images"));
        Files.createDirectories(root.resolve("documents"));
        Files.createDirectories(root.resolve("temp"));
    }

    @Override
    public StoredObject store(String storageKey, InputStream content, long contentLength, String contentType)
            throws IOException {
        Path target = resolveKey(storageKey);
        Files.createDirectories(target.getParent());
        Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
        String publicUrl = "/uploads/" + normalizeKey(storageKey);
        String filename = target.getFileName().toString();
        return new StoredObject(normalizeKey(storageKey), publicUrl, filename, contentLength, contentType);
    }

    @Override
    public void delete(String storageKey) throws IOException {
        Path target = resolveKey(storageKey);
        Files.deleteIfExists(target);
    }

    @Override
    public boolean isKeySafe(String storageKey) {
        try {
            resolveKey(storageKey);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public Path rootPath() {
        return root;
    }

    private Path resolveKey(String storageKey) {
        String key = normalizeKey(storageKey);
        if (key.contains("..") || key.startsWith("/")) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        Path target = root.resolve(key).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return target;
    }

    private static String normalizeKey(String storageKey) {
        return storageKey.replace("\\", "/").replaceAll("^/+", "");
    }
}
