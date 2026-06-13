package com.lera.connect_service.security;

import com.lera.connect_service.entity.Conversation;
import com.lera.connect_service.entity.Lead;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ConnectSecurityTest {

    private static final UUID CENTER_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID CENTER_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @Test
    void effectiveCenterId_orgWide_allowsNullForGlobal() {
        AuthUser chair = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("CHAIRMAN")
                .build();
        assertEquals(null, ConnectSecurity.effectiveCenterId(chair, null));
    }

    @Test
    void effectiveCenterId_orgWide_allowsExplicitOtherCenter() {
        AuthUser ceo = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("CEO")
                .build();
        assertEquals(CENTER_B, ConnectSecurity.effectiveCenterId(ceo, CENTER_B));
    }

    @Test
    void effectiveCenterId_staffWithJwt_forcesJwtWhenRequestedNull() {
        AuthUser staff = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("STAFF")
                .build();
        assertEquals(CENTER_A, ConnectSecurity.effectiveCenterId(staff, null));
    }

    @Test
    void effectiveCenterId_staffWithJwt_rejectsOtherCenter() {
        AuthUser staff = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("ACADEMIC_MANAGER")
                .build();
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> ConnectSecurity.effectiveCenterId(staff, CENTER_B));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void effectiveCenterId_staffWithoutJwt_forbidden() {
        AuthUser staff = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(null)
                .roleName("STAFF")
                .build();
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> ConnectSecurity.effectiveCenterId(staff, null));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void assertCanAccessLead_staff_sameCenter_ok() {
        AuthUser mgr = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("CENTER_MANAGER")
                .build();
        Lead lead = new Lead();
        lead.setCenterId(CENTER_A);
        ConnectSecurity.assertCanAccessLead(mgr, lead);
    }

    @Test
    void assertCanAccessLead_staff_crossCenter_forbidden() {
        AuthUser mgr = AuthUser.builder()
                .userId(UUID.randomUUID())
                .centerId(CENTER_A)
                .roleName("CENTER_ADMIN")
                .build();
        Lead lead = new Lead();
        lead.setCenterId(CENTER_B);
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> ConnectSecurity.assertCanAccessLead(mgr, lead));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void assertCanAccessConversation_participant_ok() {
        UUID userId = UUID.randomUUID();
        AuthUser user = AuthUser.builder().userId(userId).roleName("STAFF").build();
        Conversation conv = Conversation.builder()
                .id(UUID.randomUUID())
                .participantIds(List.of(userId, UUID.randomUUID()))
                .isActive(true)
                .build();
        ConnectSecurity.assertCanAccessConversation(user, conv);
    }

    @Test
    void assertCanAccessConversation_nonParticipant_forbidden() {
        AuthUser user = AuthUser.builder()
                .userId(UUID.randomUUID())
                .roleName("CHAIRMAN")
                .build();
        Conversation conv = Conversation.builder()
                .id(UUID.randomUUID())
                .participantIds(List.of(UUID.randomUUID()))
                .isActive(true)
                .build();
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> ConnectSecurity.assertCanAccessConversation(user, conv));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void assertActorIsSelf_rejectsSpoofedCaller() {
        UUID real = UUID.randomUUID();
        AuthUser user = AuthUser.builder().userId(real).roleName("STAFF").build();
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> ConnectSecurity.assertActorIsSelf(user, UUID.randomUUID().toString()));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
