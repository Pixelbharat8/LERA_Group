package com.lera.connect_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@leraacademy.edu.vn}")
    private String fromAddress;

    @Value("${spring.mail.enabled:false}")
    private boolean emailEnabled;

    /**
     * Send a simple text email
     */
    @Async
    public void sendSimpleEmail(String to, String subject, String body) {
        if (!emailEnabled) {
            log.info("Email disabled. Would send to={} subject={}", to, subject);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Sent email to={} subject={}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to={} subject={}: {}", to, subject, e.getMessage());
        }
    }

    /**
     * Send an HTML email
     */
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        if (!emailEnabled) {
            log.info("Email disabled. Would send HTML to={} subject={}", to, subject);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Sent HTML email to={} subject={}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send HTML email to={}: {}", to, e.getMessage());
        }
    }

    // ============ TEMPLATE EMAILS ============

    /**
     * Send welcome email to new user
     */
    public void sendWelcomeEmail(String to, String fullName) {
        String subject = "Welcome to LERA Academy! | Chào mừng đến LERA Academy!";
        String html = String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Welcome to LERA Academy!</h2>
                <p>Dear <strong>%s</strong>,</p>
                <p>Your account has been created successfully. You can now log in to access your dashboard.</p>
                <hr/>
                <h3 style="color: #2563eb;">Chào mừng đến LERA Academy!</h3>
                <p>Kính gửi <strong>%s</strong>,</p>
                <p>Tài khoản của bạn đã được tạo thành công. Bạn có thể đăng nhập để truy cập bảng điều khiển.</p>
                <br/>
                <p style="color: #6b7280; font-size: 12px;">LERA Academy - Education for Excellence</p>
            </div>
            """, fullName, fullName);
        sendHtmlEmail(to, subject, html);
    }

    /**
     * Send fee payment reminder
     */
    public void sendPaymentReminder(String to, String studentName, String amount, String dueDate) {
        String subject = "Fee Payment Reminder | Nhắc nhở thanh toán học phí";
        String html = String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Payment Reminder</h2>
                <p>Dear Parent/Guardian,</p>
                <p>This is a reminder that a payment of <strong>%s</strong> for student <strong>%s</strong> is due on <strong>%s</strong>.</p>
                <p>Please log in to your parent portal to make the payment.</p>
                <hr/>
                <h3 style="color: #dc2626;">Nhắc nhở thanh toán</h3>
                <p>Khoản thanh toán <strong>%s</strong> cho học sinh <strong>%s</strong> đến hạn vào <strong>%s</strong>.</p>
                <br/>
                <p style="color: #6b7280; font-size: 12px;">LERA Academy - Education for Excellence</p>
            </div>
            """, amount, studentName, dueDate, amount, studentName, dueDate);
        sendHtmlEmail(to, subject, html);
    }

    /**
     * Send attendance alert to parent
     */
    public void sendAttendanceAlert(String to, String studentName, String date, String status) {
        String subject = "Attendance Alert | Thông báo điểm danh - " + studentName;
        String html = String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">Attendance Alert</h2>
                <p>Student <strong>%s</strong> was marked as <strong>%s</strong> on <strong>%s</strong>.</p>
                <hr/>
                <h3 style="color: #f59e0b;">Thông báo điểm danh</h3>
                <p>Học sinh <strong>%s</strong> được đánh dấu <strong>%s</strong> vào ngày <strong>%s</strong>.</p>
                <br/>
                <p style="color: #6b7280; font-size: 12px;">LERA Academy - Education for Excellence</p>
            </div>
            """, studentName, status, date, studentName, status, date);
        sendHtmlEmail(to, subject, html);
    }

    /**
     * Send leave request notification
     */
    public void sendLeaveRequestNotification(String to, String employeeName, String leaveType, String dates) {
        String subject = "Leave Request | Đơn xin nghỉ phép - " + employeeName;
        String body = String.format(
            "%s has submitted a %s leave request for %s.\nPlease log in to approve or reject.",
            employeeName, leaveType, dates);
        sendSimpleEmail(to, subject, body);
    }

    /**
     * Send grade notification to parent
     */
    public void sendGradeNotification(String to, String studentName, String subject_name, String grade) {
        String subject = "New Grade Posted | Điểm mới - " + studentName;
        String html = String.format("""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #16a34a;">Grade Update</h2>
                <p>A new grade has been posted for <strong>%s</strong>:</p>
                <p>Subject: <strong>%s</strong> — Grade: <strong>%s</strong></p>
                <hr/>
                <h3 style="color: #16a34a;">Cập nhật điểm</h3>
                <p>Điểm mới cho <strong>%s</strong>: Môn <strong>%s</strong> — Điểm: <strong>%s</strong></p>
                <br/>
                <p style="color: #6b7280; font-size: 12px;">LERA Academy - Education for Excellence</p>
            </div>
            """, studentName, subject_name, grade, studentName, subject_name, grade);
        sendHtmlEmail(to, subject, html);
    }
}
