package com.lera.academy_service.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "lera.storage")
public class StorageProperties {

    /** {@code local} (default) or {@code s3}. */
    private String backend = "local";

    /** Local root directory (trailing slash optional). */
    private String localDir;

    private final S3 s3 = new S3();

    public String getBackend() {
        return backend;
    }

    public void setBackend(String backend) {
        this.backend = backend;
    }

    public String getLocalDir() {
        return localDir;
    }

    public void setLocalDir(String localDir) {
        this.localDir = localDir;
    }

    public S3 getS3() {
        return s3;
    }

    public static class S3 {
        private String bucket;
        private String region = "ap-southeast-1";
        /** Optional — set for MinIO (e.g. http://localhost:9000). */
        private String endpoint;
        /** Public CDN/base URL returned to clients (no trailing slash). */
        private String publicBaseUrl;
        private String accessKey;
        private String secretKey;
        private boolean pathStyleAccess = true;

        public String getBucket() {
            return bucket;
        }

        public void setBucket(String bucket) {
            this.bucket = bucket;
        }

        public String getRegion() {
            return region;
        }

        public void setRegion(String region) {
            this.region = region;
        }

        public String getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(String endpoint) {
            this.endpoint = endpoint;
        }

        public String getPublicBaseUrl() {
            return publicBaseUrl;
        }

        public void setPublicBaseUrl(String publicBaseUrl) {
            this.publicBaseUrl = publicBaseUrl;
        }

        public String getAccessKey() {
            return accessKey;
        }

        public void setAccessKey(String accessKey) {
            this.accessKey = accessKey;
        }

        public String getSecretKey() {
            return secretKey;
        }

        public void setSecretKey(String secretKey) {
            this.secretKey = secretKey;
        }

        public boolean isPathStyleAccess() {
            return pathStyleAccess;
        }

        public void setPathStyleAccess(boolean pathStyleAccess) {
            this.pathStyleAccess = pathStyleAccess;
        }
    }
}
