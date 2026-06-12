package com.lera.payment_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Optional payment receipt emails when {@link JavaMailSender} is configured.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoicePaidMailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${lera.mail.from:}")
    private String fromAddress;

    @Value("${spring.mail.username:}")
    private String springMailUsername;

    public boolean sendPaymentReceipt(
            String toEmail,
            String studentName,
            String invoiceNumber,
            String amountFormatted,
            String currency) {
        if (!StringUtils.hasText(toEmail)) {
            return false;
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            return false;
        }
        String from = StringUtils.hasText(fromAddress) ? fromAddress.trim()
                : springMailUsername != null ? springMailUsername.trim() : "";
        if (!StringUtils.hasText(from)) {
            log.warn("Cannot send receipt email: set lera.mail.from or spring.mail.username");
            return false;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(toEmail.trim());
        message.setSubject("LERA — payment received (" + invoiceNumber + ")");
        message.setText(
                "Hello,\n\n"
                        + "We received your payment for "
                        + studentName
                        + ".\n\n"
                        + "Invoice: "
                        + invoiceNumber
                        + "\n"
                        + "Amount: "
                        + amountFormatted
                        + " "
                        + currency
                        + "\n\n"
                        + "Thank you.\n"
                        + "— LERA");

        mailSender.send(message);
        return true;
    }
}
