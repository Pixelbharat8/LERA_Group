package com.lera.identity_service.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class UserPermissionDTO {

    private UUID id;
    private UUID userId;
    private Boolean dashboard;
    private Boolean centers;
    private Boolean users;
    private Boolean students;
    private Boolean teachers;
    private Boolean classes;
    private Boolean courses;
    private Boolean attendance;
    private Boolean payments;
    private Boolean payroll;
    private Boolean reports;
    private Boolean settings;
    private Boolean aiAssistant;
    private Boolean communication;
    private Boolean documents;
    private Boolean academyServiceEnabled;
    private Boolean paymentServiceEnabled;
    private Boolean attendanceServiceEnabled;
    private Boolean payrollServiceEnabled;
    private Boolean connectServiceEnabled;
    private Boolean aiGatewayEnabled;
    private UUID grantedBy;
    private LocalDateTime grantedAt;
    private UUID updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Boolean getDashboard() { return dashboard; }
    public void setDashboard(Boolean dashboard) { this.dashboard = dashboard; }

    public Boolean getCenters() { return centers; }
    public void setCenters(Boolean centers) { this.centers = centers; }

    public Boolean getUsers() { return users; }
    public void setUsers(Boolean users) { this.users = users; }

    public Boolean getStudents() { return students; }
    public void setStudents(Boolean students) { this.students = students; }

    public Boolean getTeachers() { return teachers; }
    public void setTeachers(Boolean teachers) { this.teachers = teachers; }

    public Boolean getClasses() { return classes; }
    public void setClasses(Boolean classes) { this.classes = classes; }

    public Boolean getCourses() { return courses; }
    public void setCourses(Boolean courses) { this.courses = courses; }

    public Boolean getAttendance() { return attendance; }
    public void setAttendance(Boolean attendance) { this.attendance = attendance; }

    public Boolean getPayments() { return payments; }
    public void setPayments(Boolean payments) { this.payments = payments; }

    public Boolean getPayroll() { return payroll; }
    public void setPayroll(Boolean payroll) { this.payroll = payroll; }

    public Boolean getReports() { return reports; }
    public void setReports(Boolean reports) { this.reports = reports; }

    public Boolean getSettings() { return settings; }
    public void setSettings(Boolean settings) { this.settings = settings; }

    public Boolean getAiAssistant() { return aiAssistant; }
    public void setAiAssistant(Boolean aiAssistant) { this.aiAssistant = aiAssistant; }

    public Boolean getCommunication() { return communication; }
    public void setCommunication(Boolean communication) { this.communication = communication; }

    public Boolean getDocuments() { return documents; }
    public void setDocuments(Boolean documents) { this.documents = documents; }

    public Boolean getAcademyServiceEnabled() { return academyServiceEnabled; }
    public void setAcademyServiceEnabled(Boolean academyServiceEnabled) { this.academyServiceEnabled = academyServiceEnabled; }

    public Boolean getPaymentServiceEnabled() { return paymentServiceEnabled; }
    public void setPaymentServiceEnabled(Boolean paymentServiceEnabled) { this.paymentServiceEnabled = paymentServiceEnabled; }

    public Boolean getAttendanceServiceEnabled() { return attendanceServiceEnabled; }
    public void setAttendanceServiceEnabled(Boolean attendanceServiceEnabled) { this.attendanceServiceEnabled = attendanceServiceEnabled; }

    public Boolean getPayrollServiceEnabled() { return payrollServiceEnabled; }
    public void setPayrollServiceEnabled(Boolean payrollServiceEnabled) { this.payrollServiceEnabled = payrollServiceEnabled; }

    public Boolean getConnectServiceEnabled() { return connectServiceEnabled; }
    public void setConnectServiceEnabled(Boolean connectServiceEnabled) { this.connectServiceEnabled = connectServiceEnabled; }

    public Boolean getAiGatewayEnabled() { return aiGatewayEnabled; }
    public void setAiGatewayEnabled(Boolean aiGatewayEnabled) { this.aiGatewayEnabled = aiGatewayEnabled; }

    public UUID getGrantedBy() { return grantedBy; }
    public void setGrantedBy(UUID grantedBy) { this.grantedBy = grantedBy; }

    public LocalDateTime getGrantedAt() { return grantedAt; }
    public void setGrantedAt(LocalDateTime grantedAt) { this.grantedAt = grantedAt; }

    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
