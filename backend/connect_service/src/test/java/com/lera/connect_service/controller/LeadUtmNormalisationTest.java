package com.lera.connect_service.controller;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The public lead forms send utm_source in lower case ("website"); the CRM's own Add Lead form
 * offers "Website", "Facebook", "Zalo" capitalised. Channel reporting groups by that column, so
 * without normalisation one channel is stored under two spellings and reported as two channels —
 * splitting both its lead count and its conversion rate on the Chairman's marketing report, which
 * is what ad budget is set from.
 *
 * Rows already stored are handled by LOWER() in LeadRepository; this covers new ones.
 */
class LeadUtmNormalisationTest {

    private String normalise(String input) throws Exception {
        Method m = LeadController.class.getDeclaredMethod("normaliseUtm", String.class);
        m.setAccessible(true);
        return (String) m.invoke(null, input);
    }

    @Test
    void foldsTheCasingTheTwoFormsDisagreeOn() throws Exception {
        assertEquals("website", normalise("Website"));
        assertEquals("website", normalise("website"));
        assertEquals("facebook", normalise("Facebook"));
        assertEquals("zalo", normalise("ZALO"));
    }

    @Test
    void trimsRatherThanCreatingAChannelWithASpaceInIt() throws Exception {
        assertEquals("referral", normalise("  Referral  "));
    }

    @Test
    void treatsBlankAsAbsentSoItGroupsWithDirectUnknown() throws Exception {
        assertNull(normalise("   "));
        assertNull(normalise(null));
    }

    @Test
    void leavesAMultiWordChannelIntactApartFromCase() throws Exception {
        assertEquals("walk-in", normalise("Walk-in"));
    }
}
