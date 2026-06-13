package com.lera.connect_service.controller;

import com.lera.connect_service.repository.CrmTriggerRepository;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectTestAuth;
import com.lera.connect_service.service.JdbcAuditWriter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CrmTriggerControllerAuthorizationTest {

    @Mock
    private CrmTriggerRepository crmTriggerRepository;

    @Mock
    private LeadRepository leadRepository;

    @Mock
    private JdbcAuditWriter auditWriter;

    private CrmTriggerController controller;

    private final UUID centerId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @BeforeEach
    void setUp() {
        controller = new CrmTriggerController(crmTriggerRepository, leadRepository, auditWriter);
    }

    @Test
    void listTriggers_orgWide_ok() {
        when(crmTriggerRepository.findAll(Pageable.unpaged())).thenReturn(org.springframework.data.domain.Page.empty());
        AuthUser orgWide = ConnectTestAuth.orgWide();
        ResponseEntity<?> res = controller.getAllTriggers(null, Pageable.unpaged(), orgWide);
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void listTriggers_centerManager_usesJwtCenter() {
        when(crmTriggerRepository.findByLeadCenterId(centerId)).thenReturn(List.of());
        AuthUser manager = ConnectTestAuth.centerManager(centerId);
        ResponseEntity<?> res = controller.getAllTriggers(null, Pageable.unpaged(), manager);
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void listTriggers_centerManager_withoutJwtCenter_forbidden() {
        AuthUser manager = AuthUser.builder()
                .userId(UUID.randomUUID())
                .roleName("CENTER_MANAGER")
                .build();
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getAllTriggers(null, Pageable.unpaged(), manager));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void listTriggers_centerManager_otherCenterParam_forbidden() {
        UUID otherCenter = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
        AuthUser manager = ConnectTestAuth.centerManager(centerId);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getAllTriggers(otherCenter, Pageable.unpaged(), manager));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
