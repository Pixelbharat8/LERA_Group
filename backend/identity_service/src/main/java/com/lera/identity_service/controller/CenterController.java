package com.lera.identity_service.controller;

import com.lera.identity_service.entity.Center;
import com.lera.identity_service.service.CenterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/centers")
@RequiredArgsConstructor
public class CenterController {
    
    private final CenterService centerService;

    /**
     * The centre list, the active list and the by-code lookup are permitted without a login so the
     * public website can show the centres. A Center row also carries managerId — the user id of
     * the member of staff who runs it — which the public site has no use for and which was being
     * handed to anyone who asked. Hide it from callers who are not signed in; the dashboard reads
     * it (chairman/centers/[id] links to that user), so authenticated callers still get it.
     */
    private static boolean isAnonymous() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(String.valueOf(auth.getPrincipal()));
    }

    /**
     * A DETACHED copy with managerId left out. Deliberately a copy and not a setManagerId(null) on
     * the row itself: these come straight from the repository and are managed entities, and
     * spring.jpa.open-in-view is only disabled in the prod profile — under docker it takes Spring's
     * default of true, so the persistence context is still open here and Hibernate would dirty-check
     * the change and write the null back. Clearing the field in place would quietly unassign every
     * centre's manager the first time an anonymous visitor loaded the website.
     */
    private static Center withoutManager(Center center) {
        return Center.builder()
                .id(center.getId())
                .code(center.getCode())
                .name(center.getName())
                .nameVi(center.getNameVi())
                .address(center.getAddress())
                .addressVi(center.getAddressVi())
                .city(center.getCity())
                .district(center.getDistrict())
                .phone(center.getPhone())
                .email(center.getEmail())
                .logoUrl(center.getLogoUrl())
                .status(center.getStatus())
                .openingDate(center.getOpeningDate())
                .capacity(center.getCapacity())
                .createdAt(center.getCreatedAt())
                .updatedAt(center.getUpdatedAt())
                .build();
    }

    private static Center publicView(Center center) {
        return center == null || !isAnonymous() ? center : withoutManager(center);
    }

    private static List<Center> publicView(List<Center> centers) {
        return !isAnonymous() ? centers : centers.stream().map(CenterController::withoutManager).toList();
    }

    @GetMapping
    public ResponseEntity<List<Center>> getAllCenters() {
        return ResponseEntity.ok(publicView(centerService.getAllCenters()));
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<Center>> getActiveCenters() {
        return ResponseEntity.ok(publicView(centerService.getActiveCenters()));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Center> getCenterById(@PathVariable UUID id) {
        return centerService.getCenterById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/code/{code}")
    public ResponseEntity<Center> getCenterByCode(@PathVariable String code) {
        return centerService.getCenterByCode(code)
                .map(c -> ResponseEntity.ok(publicView(c)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/city/{city}")
    public ResponseEntity<List<Center>> getCentersByCity(@PathVariable String city) {
        return ResponseEntity.ok(centerService.getCentersByCity(city));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO')")
    public ResponseEntity<?> createCenter(@Valid @RequestBody Center center) {
        try {
            Center created = centerService.createCenter(center);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "An unexpected error occurred"));
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Center> updateCenter(@PathVariable UUID id, @Valid @RequestBody Center center) {
        return centerService.updateCenter(id, center)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO')")
    public ResponseEntity<Void> deleteCenter(@PathVariable UUID id) {
        if (centerService.deleteCenter(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR')")
    public ResponseEntity<Center> updateCenterStatus(@PathVariable UUID id, @RequestParam String status) {
        return centerService.updateCenterStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
