package com.lera.attendance_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/** Optional email for {@link AttendanceAutomationService#remindTomorrowClasses()}. */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClassReminderMailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${lera.mail.from:}")
    private String fromAddress;

    @Value("${spring.mail.username:}")
    private String springMailUsername;

    public boolean sendTomorrowReminder(String toEmail, String bodyText) {
        if (!StringUtils.hasText(toEmail)) {
            return false;
        }
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            return false;
        }
        String from = StringUtils.hasText(fromAddress) ? fromAddress.trim()
                : springMailUsername != null ? springMailUsername.trim() : "";
        if (!StringUtils.hasText(from)) {
            return false;
        }
        SimpleMailMessage m = new SimpleMailMessage();
        m.setFrom(from);
        m.setTo(toEmail.trim());
        m.setSubject("LERA — class reminder (tomorrow)");
        m.setText(bodyText);
        sender.send(m);
        return true;
    }
}
