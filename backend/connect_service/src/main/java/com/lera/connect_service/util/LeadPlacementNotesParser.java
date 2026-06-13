package com.lera.connect_service.util;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts structured placement data merged into {@code Lead.notes} by
 * {@link com.lera.connect_service.controller.PublicLeadController}.
 */
public final class LeadPlacementNotesParser {

    private static final Pattern SCORE = Pattern.compile(
            "\\[placement\\]\\s*scoreOutOf16=(\\d+)/16", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRACK_EN = Pattern.compile("trackEn=([^;\\n]+)", Pattern.CASE_INSENSITIVE);

    private LeadPlacementNotesParser() {
    }

    public record ParsedPlacement(Integer scoreOutOf16, String trackEn) {
    }

    /**
     * @return non-empty if notes contain a public-lead placement block
     */
    public static Optional<ParsedPlacement> parse(String notes) {
        if (notes == null || notes.isBlank()) {
            return Optional.empty();
        }
        Integer score = null;
        Matcher sm = SCORE.matcher(notes);
        if (sm.find()) {
            try {
                score = Integer.parseInt(sm.group(1), 10);
            } catch (NumberFormatException ignored) {
                // leave null
            }
        }
        String track = null;
        Matcher tm = TRACK_EN.matcher(notes);
        if (tm.find()) {
            track = tm.group(1).trim();
            if (track.isEmpty()) {
                track = null;
            }
        }
        if (score == null && track == null) {
            return Optional.empty();
        }
        return Optional.of(new ParsedPlacement(score, track));
    }
}
