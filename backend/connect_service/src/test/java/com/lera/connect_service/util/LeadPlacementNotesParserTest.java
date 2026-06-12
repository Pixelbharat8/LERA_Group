package com.lera.connect_service.util;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LeadPlacementNotesParserTest {

    @Test
    void parsesScoreAndTrackFromPublicLeadFormat() {
        String notes = "[placement] scoreOutOf16=12/16; trackEn=Intermediate\n[Trial / placement funnel] extra";
        Optional<LeadPlacementNotesParser.ParsedPlacement> p = LeadPlacementNotesParser.parse(notes);
        assertTrue(p.isPresent());
        assertEquals(12, p.get().scoreOutOf16());
        assertEquals("Intermediate", p.get().trackEn());
    }

    @Test
    void emptyWhenNoPlacementBlock() {
        assertTrue(LeadPlacementNotesParser.parse(null).isEmpty());
        assertTrue(LeadPlacementNotesParser.parse("").isEmpty());
        assertTrue(LeadPlacementNotesParser.parse("some random notes").isEmpty());
    }

    @Test
    void trackOnlyStillParses() {
        String notes = "trackEn=Beginner / foundation\nhello";
        Optional<LeadPlacementNotesParser.ParsedPlacement> p = LeadPlacementNotesParser.parse(notes);
        assertTrue(p.isPresent());
        assertNull(p.get().scoreOutOf16());
        assertEquals("Beginner / foundation", p.get().trackEn());
    }

    @Test
    void multiline_notes_with_placement_block() {
        String notes = """
                Contact preference: email
                [placement] scoreOutOf16=14/16; trackEn=Upper intermediate
                More text below.
                """;
        Optional<LeadPlacementNotesParser.ParsedPlacement> p = LeadPlacementNotesParser.parse(notes);
        assertTrue(p.isPresent());
        assertEquals(14, p.get().scoreOutOf16());
        assertEquals("Upper intermediate", p.get().trackEn());
    }

    @Test
    void invalid_score_segment_still_picks_track() {
        String notes = "[placement] scoreOutOf16=xx/16; trackEn=Starter";
        Optional<LeadPlacementNotesParser.ParsedPlacement> p = LeadPlacementNotesParser.parse(notes);
        assertTrue(p.isPresent());
        assertNull(p.get().scoreOutOf16());
        assertEquals("Starter", p.get().trackEn());
    }

    @Test
    void placement_marker_is_case_insensitive() {
        String notes = "[PLACEMENT] scoreOutOf16=5/16";
        Optional<LeadPlacementNotesParser.ParsedPlacement> p = LeadPlacementNotesParser.parse(notes);
        assertTrue(p.isPresent());
        assertEquals(5, p.get().scoreOutOf16());
    }

    @Test
    void score_without_track_parses() {
        String notes = "[placement] scoreOutOf16=11/16";
        Optional<LeadPlacementNotesParser.ParsedPlacement> p = LeadPlacementNotesParser.parse(notes);
        assertTrue(p.isPresent());
        assertEquals(11, p.get().scoreOutOf16());
        assertNull(p.get().trackEn());
    }

    @Test
    void zero_score_parses() {
        String notes = "[placement] scoreOutOf16=0/16";
        Optional<LeadPlacementNotesParser.ParsedPlacement> p = LeadPlacementNotesParser.parse(notes);
        assertTrue(p.isPresent());
        assertEquals(0, p.get().scoreOutOf16());
    }

    @Test
    void first_score_match_is_used_when_notes_contain_multiple_blocks() {
        String notes = """
                [placement] scoreOutOf16=8/16
                later edit [placement] scoreOutOf16=15/16
                """;
        Optional<LeadPlacementNotesParser.ParsedPlacement> p = LeadPlacementNotesParser.parse(notes);
        assertTrue(p.isPresent());
        assertEquals(8, p.get().scoreOutOf16());
    }
}
