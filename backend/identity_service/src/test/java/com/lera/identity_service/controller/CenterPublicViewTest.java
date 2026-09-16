package com.lera.identity_service.controller;

import com.lera.identity_service.entity.Center;
import com.lera.identity_service.service.CenterService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * /api/centers, /api/centers/active and /api/centers/code/** are permitted without a login so the
 * public website can list the centres. The row also carries managerId — the user id of the member
 * of staff who runs that centre — and it was being handed to anyone who asked.
 *
 * The second test is the more important one. The obvious fix is setManagerId(null) on the row
 * before returning it, and that would have been a data-loss bug: these come straight from the
 * repository as managed entities, and spring.jpa.open-in-view is only disabled in the prod
 * profile, so under docker the persistence context is still open and Hibernate would dirty-check
 * the change and write the null back — quietly unassigning every centre's manager the first time
 * an anonymous visitor loaded the site.
 */
@ExtendWith(MockitoExtension.class)
class CenterPublicViewTest {

    @Mock private CenterService centerService;
    @InjectMocks private CenterController controller;

    private static final UUID MANAGER = UUID.randomUUID();

    private Center centre() {
        return Center.builder()
                .id(UUID.randomUUID())
                .code("HP01")
                .name("Lê Chân")
                .phone("0225 123 456")
                .managerId(MANAGER)
                .status("ACTIVE")
                .build();
    }

    private void signedIn() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("someone", "n/a",
                        List.of(new SimpleGrantedAuthority("ROLE_CHAIRMAN"))));
    }

    private void anonymous() {
        SecurityContextHolder.getContext().setAuthentication(
                new AnonymousAuthenticationToken("key", "anonymousUser",
                        List.of(new SimpleGrantedAuthority("ROLE_ANONYMOUS"))));
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void anonymousCallersDoNotSeeWhoManagesACentre() {
        when(centerService.getAllCenters()).thenReturn(List.of(centre()));
        anonymous();

        Center served = controller.getAllCenters().getBody().get(0);

        assertNull(served.getManagerId(), "managerId is an internal user id; the public site never needs it");
        assertEquals("Lê Chân", served.getName(), "the rest of the centre is still public");
        assertEquals("0225 123 456", served.getPhone());
    }

    @Test
    void servingAnonymouslyDoesNotClearTheManagerOnTheRowItself() {
        Center managed = centre();
        when(centerService.getAllCenters()).thenReturn(List.of(managed));
        anonymous();

        controller.getAllCenters();

        assertEquals(MANAGER, managed.getManagerId(),
                "the entity handed back by the service must not be modified — it is a managed JPA "
                        + "row and open-in-view would flush the change, unassigning the manager");
    }

    @Test
    void signedInCallersStillGetTheManager() {
        when(centerService.getAllCenters()).thenReturn(List.of(centre()));
        signedIn();

        assertEquals(MANAGER, controller.getAllCenters().getBody().get(0).getManagerId(),
                "the dashboard links to the manager's user page and needs this");
    }
}
