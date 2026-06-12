package com.lera.academy_service.storage;

import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalFileStorageTest {

    @TempDir
    Path tempDir;

    @Test
    void storeAndDelete_roundTrip() throws Exception {
        StorageProperties props = new StorageProperties();
        props.setLocalDir(tempDir.toString());
        LocalFileStorage storage = new LocalFileStorage(props);
        storage.init();

        StoredObject stored = storage.store(
                "images/test.png",
                new ByteArrayInputStream("png-bytes".getBytes(StandardCharsets.UTF_8)),
                9,
                "image/png");

        assertEquals("/uploads/images/test.png", stored.publicUrl());
        assertTrue(Files.exists(tempDir.resolve("images/test.png")));

        storage.delete("images/test.png");
        assertFalse(Files.exists(tempDir.resolve("images/test.png")));
    }

    @Test
    void rejectsPathTraversal() throws Exception {
        StorageProperties props = new StorageProperties();
        props.setLocalDir(tempDir.toString());
        LocalFileStorage storage = new LocalFileStorage(props);
        storage.init();

        assertFalse(storage.isKeySafe("../etc/passwd"));
        assertFalse(storage.isKeySafe("images/../../secret"));
    }
}
