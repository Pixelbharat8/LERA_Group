package com.lera.academy_service.storage;

/**
 * Result of a successful store operation — {@link #publicUrl()} is what clients persist/display.
 */
public record StoredObject(
        String storageKey,
        String publicUrl,
        String filename,
        long size,
        String contentType) {}
