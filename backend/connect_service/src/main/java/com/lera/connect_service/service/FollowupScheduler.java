package com.lera.connect_service.service;

import com.lera.connect_service.entity.Followup;
import com.lera.connect_service.entity.Lead;
import com.lera.connect_service.repository.FollowupRepository;
import com.lera.connect_service.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Auto-send for follow-up cadences. Every minute it fires due, not-yet-actioned steps:
 *  - notifies the assigned rep in-app (+ push) — always;
 *  - for an EMAIL step, emails the parent via EmailService (which actually sends when
 *    spring.mail.enabled=true, otherwise logs — no fabricated delivery);
 *  - SMS/Zalo steps are notified to the rep to action (no provider wired yet);
 *  - marks the step DONE (or FAILED on error).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FollowupScheduler {

    private final FollowupRepository followupRepository;
    private final LeadRepository leadRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void processDueFollowups() {
        List<Followup> due = followupRepository.findByStatusAndScheduledAtLessThanEqual("PENDING", LocalDateTime.now());
        if (due.isEmpty()) return;

        int sent = 0;
        for (Followup f : due) {
            try {
                Lead lead = f.getLeadId() != null ? leadRepository.findById(f.getLeadId()).orElse(null) : null;
                String who = lead == null ? "lead"
                        : (lead.getStudentName() != null ? lead.getStudentName() : lead.getParentName());
                String body = stripTag(f.getNotes());

                // 1) Notify the owning rep (assigned user, else the lead's owner).
                UUID rep = f.getUserId() != null ? f.getUserId() : (lead != null ? lead.getAssignedTo() : null);
                if (rep != null) {
                    notificationService.createNotification(
                            rep,
                            "Follow-up due: " + f.getActionType(),
                            body + " — " + who,
                            "FOLLOWUP");
                }

                // 2) EMAIL step -> email the parent (sends only if mail is enabled; logs otherwise).
                if ("EMAIL".equalsIgnoreCase(f.getActionType())
                        && lead != null && lead.getParentEmail() != null && !lead.getParentEmail().isBlank()) {
                    emailService.sendSimpleEmail(lead.getParentEmail(), "LERA Academy", body);
                }

                f.setStatus("DONE");
                followupRepository.save(f);
                sent++;
            } catch (Exception e) {
                log.error("Failed to process follow-up {}: {}", f.getId(), e.getMessage());
                f.setStatus("FAILED");
                followupRepository.save(f);
            }
        }
        log.info("Auto-send: processed {} due follow-up(s)", sent);
    }

    /** Drop a leading "[Sequence name] " tag for the outbound message. */
    private static String stripTag(String notes) {
        if (notes == null) return "Follow-up from LERA Academy";
        return notes.replaceFirst("^\\[[^\\]]*\\]\\s*", "");
    }
}
