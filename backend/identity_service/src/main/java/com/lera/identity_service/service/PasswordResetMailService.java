package com.lera.identity_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Sends password-reset links when {@link JavaMailSender} is configured ({@code spring.mail.host}, etc.).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetMailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${lera.mail.from:}")
    private String fromAddress;

    @Value("${spring.mail.username:}")
    private String springMailUsername;

    /**
     * @return true if an email was handed to the mail provider; false if mail is not configured or misconfigured.
     */
    public boolean sendPasswordReset(String toEmail, String resetUrl) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.debug("JavaMailSender not available — add spring-boot-starter-mail config (e.g. spring.mail.host)");
            return false;
        }
        String from = StringUtils.hasText(fromAddress) ? fromAddress.trim() : springMailUsername != null ? springMailUsername.trim() : "";
        if (!StringUtils.hasText(from)) {
            log.warn("Cannot send password reset email: set lera.mail.from or spring.mail.username");
            return false;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(toEmail);
        message.setSubject("Reset your LERA password");
        message.setText(
                "You requested a password reset.\n\n"
                        + "Open this link to choose a new password (valid for 15 minutes):\n"
                        + resetUrl
                        + "\n\n"
                        + "If you did not request this, you can ignore this email.");

        mailSender.send(message);
        return true;
    }
}
