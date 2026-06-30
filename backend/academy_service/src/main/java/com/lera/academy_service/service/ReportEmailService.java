package com.lera.academy_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Arrays;

/**
 * Emails generated reports to recipients. Mirrors the connect-service pattern: gated behind
 * {@code spring.mail.enabled} (default false) so it is a safe no-op until SMTP is configured,
 * and any send failure is logged rather than thrown.
 */
@Service
@Slf4j
public class ReportEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@leraacademy.edu.vn}")
    private String from;

    @Value("${spring.mail.enabled:false}")
    private boolean enabled;

    public ReportEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /** Returns true if the email was actually sent. */
    public boolean sendReport(String recipientsCsv, String reportName, String summary, String csv) {
        if (recipientsCsv == null || recipientsCsv.isBlank()) return false;
        String[] to = Arrays.stream(recipientsCsv.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toArray(String[]::new);
        if (to.length == 0) return false;

        if (!enabled) {
            log.info("Mail disabled — would have emailed report '{}' to {}", reportName, String.join(", ", to));
            return false;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject("LERA Academy report: " + reportName);
            message.setText(summary + "\n\n----- " + reportName + " -----\n" + csv);
            mailSender.send(message);
            log.info("Emailed report '{}' to {} recipient(s)", reportName, to.length);
            return true;
        } catch (Exception e) {
            log.error("Failed to email report '{}': {}", reportName, e.getMessage());
            return false;
        }
    }
}
