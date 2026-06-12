package com.lera.connect_service.storage;

import static org.junit.jupiter.api.Assertions.*;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class ConnectAttachmentStorageTest {

    @Test
    void storeReadDelete_roundTrip() throws Exception {
        ConnectAttachmentStorage storage = new ConnectAttachmentStorage();
        ReflectionTestUtils.setField(storage, "uploadDir", Files.createTempDirectory("lera-chat").toString());
        storage.init();

        String name = storage.store(
                new ByteArrayInputStream("hello".getBytes(StandardCharsets.UTF_8)), "note.txt");
        assertNotNull(storage.read(name));
        assertEquals("/api/attachments/files/" + name, ConnectAttachmentStorage.publicFileUrl(name));

        storage.delete(name);
        assertNull(storage.read(name));
    }

    @Test
    void rejectsPathTraversal() throws Exception {
        ConnectAttachmentStorage storage = new ConnectAttachmentStorage();
        ReflectionTestUtils.setField(storage, "uploadDir", Files.createTempDirectory("lera-chat2").toString());
        storage.init();

        assertThrows(IllegalArgumentException.class, () -> storage.read("../secret"));
    }
}
