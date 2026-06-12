package com.lera.academy_service.storage;

import java.io.IOException;
import java.io.InputStream;

/**
 * Abstraction for homework/CMS uploads — local disk by default, S3/MinIO when configured.
 */
public interface FileStorage {

    StoredObject store(String storageKey, InputStream content, long contentLength, String contentType)
            throws IOException;

    void delete(String storageKey) throws IOException;

    /** True if {@code storageKey} resolves inside the configured storage root. */
    boolean isKeySafe(String storageKey);
}
