package com.lera.connect_service.controller;

import com.lera.connect_service.repository.BlockedUserRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectTestAuth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class BlockUserControllerAuthorizationTest {

    @Mock
    private BlockedUserRepository blockedUserRepository;

    private BlockUserController controller;

    private final UUID self = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private final UUID other = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @BeforeEach
    void setUp() {
        controller = new BlockUserController(blockedUserRepository);
    }

    @Test
    void blockUser_impersonation_forbidden() {
        AuthUser user = ConnectTestAuth.participant(self);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.blockUser(Map.of(
                        "blockerId", other.toString(),
                        "blockedId", UUID.randomUUID().toString()), user));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void checkBlockBetween_thirdParty_forbidden() {
        AuthUser user = ConnectTestAuth.participant(self);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.checkBlockBetween(
                        UUID.randomUUID().toString(),
                        UUID.randomUUID().toString(),
                        user));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
