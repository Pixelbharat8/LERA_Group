package com.lera.connect_service.controller;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * A public lead used to be stored with center_id NULL, because none of the eight public entry
 * points sends a centre. Lead reads are centre-scoped — ConnectSecurity rejects a lead whose
 * centre does not match the caller's, and refuses a caller with no centre at all — so every
 * website enquiry was visible only to org-wide roles, and the centre staff who return enquiries
 * had a permanently empty needs-contact queue.
 */
class PublicLeadCenterAssignmentTest {

    private final UUID onlyCentre = UUID.randomUUID();

    @SuppressWarnings("unchecked")
    private PublicLeadController controllerSeeing(List<UUID> activeCentres) {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.query(anyString(), any(RowMapper.class))).thenAnswer(inv -> {
            String sql = inv.getArgument(0);
            assertTrue(sql.contains("status = 'ACTIVE'"),
                    "only an ACTIVE centre may be assigned: " + sql);
            assertTrue(sql.contains("LIMIT 2"),
                    "two rows are enough to tell 'exactly one' from 'several'; do not read the table");
            return activeCentres;
        });
        PublicLeadController c = new PublicLeadController(null, null, null, jdbc);
        return c;
    }

    private UUID resolve(PublicLeadController c) {
        return (UUID) ReflectionTestUtils.invokeMethod(c, "soleActiveCenterId");
    }

    @Test
    void oneActiveCentreIsAssignedSoCentreStaffCanSeeTheLead() {
        assertEquals(onlyCentre, resolve(controllerSeeing(List.of(onlyCentre))));
    }

    @Test
    void severalActiveCentresLeaveItUnassignedRatherThanGuessing() {
        // Picking one would hand the enquiry to the wrong branch. Org-wide triage is correct here.
        assertNull(resolve(controllerSeeing(List.of(UUID.randomUUID(), UUID.randomUUID()))));
    }

    @Test
    void noActiveCentreLeavesItUnassigned() {
        assertNull(resolve(controllerSeeing(List.of())));
    }

    @Test
    @SuppressWarnings("unchecked")
    void aDatabaseFailureNeverLosesTheLead() {
        // An unassigned lead is recoverable; a rejected submission is a customer who walked away.
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.query(anyString(), any(RowMapper.class)))
                .thenThrow(new RuntimeException("centres table unavailable"));
        assertNull(resolve(new PublicLeadController(null, null, null, jdbc)));
    }
}
