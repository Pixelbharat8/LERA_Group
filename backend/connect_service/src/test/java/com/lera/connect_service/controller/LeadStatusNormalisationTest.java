package com.lera.connect_service.controller;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

/**
 * A lead's status is compared with case-sensitive equals throughout LeadController — the
 * duplicate check skips leads that are "CONVERTED" or "LOST", and firstContactedAt is stamped
 * on anything that is not "NEW". So a client that writes the wrong case does not merely display
 * oddly: a lead stored as "converted" is still treated as open, and one stored as "new" gets
 * stamped as contacted.
 *
 * The superadmin lead console wrote exactly those lowercase values. That page is fixed, but the
 * server is where this has to be stopped, so no future client can reintroduce it.
 */
class LeadStatusNormalisationTest {

    private String normalise(String input) throws Exception {
        Method m = LeadController.class.getDeclaredMethod("normaliseStatus", String.class);
        m.setAccessible(true);
        try {
            return (String) m.invoke(null, input);
        } catch (InvocationTargetException e) {
            if (e.getCause() instanceof RuntimeException re) throw re;
            throw e;
        }
    }

    @Test
    void upperCasesAKnownStatusWhateverCaseItArrivesIn() throws Exception {
        assertEquals("CONTACTED", normalise("contacted"));
        assertEquals("CONVERTED", normalise("Converted"));
        assertEquals("TRIAL_BOOKED", normalise("  trial_booked  "));
    }

    @Test
    void leavesACorrectStatusAlone() throws Exception {
        for (String s : new String[]{"NEW", "CONTACTED", "QUALIFIED", "TRIAL_BOOKED",
                                     "TRIAL_ATTENDED", "NO_SHOW", "CONVERTED", "LOST"}) {
            assertEquals(s, normalise(s));
        }
    }

    @Test
    void rejectsAStatusOutsideTheVocabulary() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> normalise("archived"));
        assertTrue(e.getMessage().contains("Unknown lead status"),
                "the caller should be told what was wrong, not have it silently written");
    }

    @Test
    void passesNullThroughSoAPartialUpdateDoesNotClearIt() throws Exception {
        assertNull(normalise(null));
    }
}
