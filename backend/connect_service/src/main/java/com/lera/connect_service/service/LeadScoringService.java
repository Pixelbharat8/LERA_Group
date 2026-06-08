package com.lera.connect_service.service;

import com.lera.connect_service.entity.Lead;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Computes a 0-100 lead score + HOT/WARM/COLD band tuned for an English centre:
 * channel quality, course/age fit, recency, engagement (pipeline stage), minus duplicates.
 */
@Service
public class LeadScoringService {

    /** Mutates the lead in place: sets {@code score} and {@code temperature}. Returns the score. */
    public int apply(Lead lead) {
        int s = 20; // base

        // Channel quality
        String src = lead.getUtmSource() != null ? lead.getUtmSource().toLowerCase() : "";
        if (src.contains("referral") || src.contains("refer")) s += 25;
        else if (src.contains("walk")) s += 20;
        else if (src.contains("web") || src.contains("organic") || src.contains("direct")) s += 15;
        else if (src.contains("facebook") || src.contains("google") || src.contains("zalo") || src.contains("tiktok")) s += 10;
        else s += 5;

        // Course intent + fit
        if (lead.getInterestedProgramId() != null) s += 15;
        Integer age = lead.getStudentAge();
        if (age != null && age >= 3 && age <= 18) s += 10;          // core English-centre age band
        if (lead.getPreferredSchedule() != null && !lead.getPreferredSchedule().isBlank()) s += 5;
        if (lead.getParentEmail() != null && !lead.getParentEmail().isBlank()) s += 5;

        // Recency
        LocalDateTime created = lead.getCreatedAt() != null ? lead.getCreatedAt() : LocalDateTime.now();
        long ageHours = ChronoUnit.HOURS.between(created, LocalDateTime.now());
        if (ageHours <= 24) s += 10;
        else if (ageHours <= 24 * 7) s += 5;

        // Engagement / pipeline progression
        String status = lead.getStatus() != null ? lead.getStatus() : "NEW";
        switch (status) {
            case "CONTACTED" -> s += 5;
            case "QUALIFIED" -> s += 10;
            case "TRIAL_BOOKED" -> s += 15;
            case "TRIAL_ATTENDED" -> s += 20;
            case "CONVERTED" -> s += 25;
            case "NO_SHOW", "LOST" -> s -= 15;
            default -> { /* NEW: no change */ }
        }

        if (Boolean.TRUE.equals(lead.getDuplicate())) s -= 20;

        s = Math.max(0, Math.min(100, s));
        lead.setScore(s);
        lead.setTemperature(s >= 70 ? "HOT" : s >= 40 ? "WARM" : "COLD");
        return s;
    }
}
