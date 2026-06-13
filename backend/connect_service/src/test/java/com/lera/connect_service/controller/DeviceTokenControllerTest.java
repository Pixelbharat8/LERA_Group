package com.lera.connect_service.controller;

import com.lera.connect_service.entity.DeviceToken;
import com.lera.connect_service.repository.DeviceTokenRepository;
import com.lera.connect_service.security.AuthUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Authorisation-focused tests for {@link DeviceTokenController}. We're
 * specifically guarding against the loopholes closed in the previous round:
 * client-supplied {@code userId}, foreign device reads, and foreign token
 * deletion. The test exercises the controller directly without spinning up
 * the full Spring stack — far cheaper than @WebMvcTest and enough to lock the
 * authz contract in.
 */
@ExtendWith(MockitoExtension.class)
class DeviceTokenControllerTest {

    @Mock private DeviceTokenRepository repo;
    @InjectMocks private DeviceTokenController controller;

    @AfterEach
    void clearContext() { SecurityContextHolder.clearContext(); }

    @BeforeEach
    void echoOnSave() {
        // Each saved row is returned as-is so we can inspect what the
        // controller chose to persist.
        org.mockito.Mockito.lenient().when(repo.save(any(DeviceToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    // ---------- POST / ----------

    @Test
    void register_alwaysUsesJwtUserId_andIgnoresBodyUserId() {
        UUID me = UUID.randomUUID();
        UUID attacker = UUID.randomUUID();
        login("PARENT", me, null);

        Map<String, Object> body = Map.of(
                "userId", attacker.toString(),       // attacker-supplied, must be ignored
                "token", "fcm-tok-aaaa",
                "platform", "android");

        var saved = controller.register(body).getBody();
        assertThat(saved).isNotNull();
        assertThat(saved.getUserId()).isEqualTo(me);
        assertThat(saved.getPlatform()).isEqualTo("ANDROID");
        assertThat(saved.getToken()).isEqualTo("fcm-tok-aaaa");
    }

    @Test
    void register_userIdOverride_isAcceptedForStaff() {
        UUID centreManager = UUID.randomUUID();
        UUID actsFor = UUID.randomUUID();
        login("CENTER_MANAGER", centreManager, null);

        Map<String, Object> body = Map.of(
                "userIdOverride", actsFor.toString(),
                "token", "ios-tok-bbbb",
                "platform", "ios");

        var saved = controller.register(body).getBody();
        assertThat(saved.getUserId()).isEqualTo(actsFor);
    }

    @Test
    void register_userIdOverride_isIgnoredForParent() {
        UUID parent = UUID.randomUUID();
        UUID hijackTarget = UUID.randomUUID();
        login("PARENT", parent, null);

        Map<String, Object> body = Map.of(
                "userIdOverride", hijackTarget.toString(),
                "token", "fcm-tok-cccc",
                "platform", "web");

        var saved = controller.register(body).getBody();
        assertThat(saved.getUserId()).isEqualTo(parent);
    }

    @Test
    void register_blankToken_returns400() {
        login("PARENT", UUID.randomUUID(), null);
        var resp = controller.register(Map.of("token", "", "platform", "ios"));
        assertThat(resp.getStatusCode().is4xxClientError()).isTrue();
        verify(repo, never()).save(any());
    }

    // ---------- GET /me ----------

    @Test
    void me_returnsOnlyCallersTokens() {
        UUID me = UUID.randomUUID();
        DeviceToken t = new DeviceToken();
        t.setUserId(me);
        t.setToken("tok");
        when(repo.findByUserId(me)).thenReturn(List.of(t));
        login("PARENT", me, null);

        var rows = controller.me().getBody();
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getUserId()).isEqualTo(me);
    }

    // ---------- GET /user/{id} ----------

    @Test
    void byUser_parent_canReadOwnTokens() {
        UUID me = UUID.randomUUID();
        when(repo.findByUserId(me)).thenReturn(List.of());
        login("PARENT", me, null);
        controller.byUser(me); // no throw
    }

    @Test
    void byUser_parent_cannotReadAnotherUsers() {
        login("PARENT", UUID.randomUUID(), null);
        assertThatThrownBy(() -> controller.byUser(UUID.randomUUID()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    void byUser_staff_canReadAnyone() {
        UUID someone = UUID.randomUUID();
        when(repo.findByUserId(someone)).thenReturn(List.of());
        login("CHAIRMAN", UUID.randomUUID(), null);
        controller.byUser(someone); // no throw
    }

    // ---------- DELETE /{token} ----------

    @Test
    void unregister_owner_succeeds() {
        UUID me = UUID.randomUUID();
        DeviceToken row = new DeviceToken();
        row.setUserId(me);
        row.setToken("mine");
        when(repo.findByToken("mine")).thenReturn(Optional.of(row));
        login("PARENT", me, null);

        controller.unregister("mine");
        verify(repo).deleteByToken("mine");
    }

    @Test
    void unregister_otherUser_isForbidden() {
        DeviceToken someoneElses = new DeviceToken();
        someoneElses.setUserId(UUID.randomUUID());
        someoneElses.setToken("victim-tok");
        when(repo.findByToken("victim-tok")).thenReturn(Optional.of(someoneElses));
        login("PARENT", UUID.randomUUID(), null);

        assertThatThrownBy(() -> controller.unregister("victim-tok"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
        verify(repo, never()).deleteByToken(any());
    }

    @Test
    void unregister_unknownToken_returns204_noFurtherChecks() {
        when(repo.findByToken("ghost")).thenReturn(Optional.empty());
        login("PARENT", UUID.randomUUID(), null);

        var resp = controller.unregister("ghost");
        assertThat(resp.getStatusCode().value()).isEqualTo(204);
        verify(repo, never()).deleteByToken(any());
    }

    private static void login(String role, UUID userId, UUID centreId) {
        AuthUser u = AuthUser.builder()
                .userId(userId).centerId(centreId).roleName(role).email("t@t").build();
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(u, "n/a", List.of()));
    }
}
