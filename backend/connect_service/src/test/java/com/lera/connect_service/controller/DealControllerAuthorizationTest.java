package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Deal;
import com.lera.connect_service.repository.LeadRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectTestAuth;
import com.lera.connect_service.service.DealServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DealControllerAuthorizationTest {

    @Mock
    private DealServiceImpl dealService;

    @Mock
    private LeadRepository leadRepository;

    private DealController controller;

    private final UUID centerId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @BeforeEach
    void setUp() {
        controller = new DealController(dealService, leadRepository);
    }

    @Test
    void listDeals_centerManager_usesJwtCenter() {
        when(dealService.getByCenterId(centerId)).thenReturn(List.of());
        AuthUser manager = ConnectTestAuth.centerManager(centerId);
        var res = controller.getAllDeals(null, null, manager);
        assertEquals(200, res.getStatusCode().value());
    }

    @Test
    void listDeals_centerManager_otherCenter_forbidden() {
        UUID other = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
        AuthUser manager = ConnectTestAuth.centerManager(centerId);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controller.getAllDeals(other, null, manager));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void listDeals_orgWide_global_ok() {
        when(dealService.getAll()).thenReturn(List.of());
        AuthUser orgWide = ConnectTestAuth.orgWide();
        var res = controller.getAllDeals(null, null, orgWide);
        assertEquals(200, res.getStatusCode().value());
    }
}
