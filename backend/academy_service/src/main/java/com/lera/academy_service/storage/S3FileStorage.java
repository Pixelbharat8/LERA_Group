package com.lera.academy_service.storage;

import java.io.IOException;
import java.io.InputStream;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@ConditionalOnProperty(name = "lera.storage.backend", havingValue = "s3")
public class S3FileStorage implements FileStorage {

    private final StorageProperties properties;
    private final S3Client s3;

    public S3FileStorage(StorageProperties properties) {
        this.properties = properties;
        StorageProperties.S3 cfg = properties.getS3();
        if (cfg.getBucket() == null || cfg.getBucket().isBlank()) {
            throw new IllegalStateException("lera.storage.s3.bucket is required when lera.storage.backend=s3");
        }
        var builder = S3Client.builder().region(Region.of(cfg.getRegion()));
        if (cfg.getEndpoint() != null && !cfg.getEndpoint().isBlank()) {
            builder.endpointOverride(java.net.URI.create(cfg.getEndpoint().trim()));
            builder.serviceConfiguration(
                    S3Configuration.builder().pathStyleAccessEnabled(cfg.isPathStyleAccess()).build());
        }
        if (cfg.getAccessKey() != null
                && !cfg.getAccessKey().isBlank()
                && cfg.getSecretKey() != null
                && !cfg.getSecretKey().isBlank()) {
            builder.credentialsProvider(StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(cfg.getAccessKey(), cfg.getSecretKey())));
        } else {
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }
        this.s3 = builder.build();
    }

    @Override
    public StoredObject store(String storageKey, InputStream content, long contentLength, String contentType)
            throws IOException {
        String key = normalizeKey(storageKey);
        if (!isKeySafe(key)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        String bucket = properties.getS3().getBucket();
        PutObjectRequest req = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .contentLength(contentLength)
                .build();
        s3.putObject(req, RequestBody.fromInputStream(content, contentLength));
        String publicUrl = publicUrlFor(key);
        String filename = key.contains("/") ? key.substring(key.lastIndexOf('/') + 1) : key;
        return new StoredObject(key, publicUrl, filename, contentLength, contentType);
    }

    @Override
    public void delete(String storageKey) throws IOException {
        String key = normalizeKey(storageKey);
        if (!isKeySafe(key)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        s3.deleteObject(DeleteObjectRequest.builder()
                .bucket(properties.getS3().getBucket())
                .key(key)
                .build());
    }

    @Override
    public boolean isKeySafe(String storageKey) {
        String key = normalizeKey(storageKey);
        return !key.isBlank() && !key.contains("..") && !key.startsWith("/");
    }

    private String publicUrlFor(String key) {
        StorageProperties.S3 cfg = properties.getS3();
        if (cfg.getPublicBaseUrl() != null && !cfg.getPublicBaseUrl().isBlank()) {
            String base = cfg.getPublicBaseUrl().trim();
            if (base.endsWith("/")) {
                base = base.substring(0, base.length() - 1);
            }
            return base + "/" + key;
        }
        if (cfg.getEndpoint() != null && !cfg.getEndpoint().isBlank()) {
            String ep = cfg.getEndpoint().trim();
            if (ep.endsWith("/")) {
                ep = ep.substring(0, ep.length() - 1);
            }
            return ep + "/" + cfg.getBucket() + "/" + key;
        }
        return "https://" + cfg.getBucket() + ".s3." + cfg.getRegion() + ".amazonaws.com/" + key;
    }

    private static String normalizeKey(String storageKey) {
        return storageKey.replace("\\", "/").replaceAll("^/+", "");
    }
}
