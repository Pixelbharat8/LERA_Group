package com.lera.identity_service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_permissions")
public class UserPermission {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "dashboard_access")
    private Boolean dashboard = true;

    @Column(name = "centers_access")
    private Boolean centers = false;

    @Column(name = "users_access")
    private Boolean users = false;

    @Column(name = "students_access")
    private Boolean students = false;

    @Column(name = "teachers_access")
    private Boolean teachers = false;

    @Column(name = "classes_access")
    private Boolean classes = false;

    @Column(name = "courses_access")
    private Boolean courses = false;

    @Column(name = "attendance_access")
    private Boolean attendance = false;

    @Column(name = "payments_access")
    private Boolean payments = false;

    @Column(name = "payroll_access")
    private Boolean payroll = false;

    @Column(name = "reports_access")
    private Boolean reports = false;

    @Column(name = "settings_access")
    private Boolean settings = false;

    @Column(name = "ai_assistant_access")
    private Boolean aiAssistant = false;

    @Column(name = "communication_access")
    private Boolean communication = false;

    @Column(name = "documents_access")
    private Boolean documents = false;

    @Column(name = "academy_service_enabled")
    private Boolean academyServiceEnabled = true;

    @Column(name = "payment_service_enabled")
    private Boolean paymentServiceEnabled = true;

    @Column(name = "attendance_service_enabled")
    private Boolean attendanceServiceEnabled = true;

    @Column(name = "payroll_service_enabled")
    private Boolean payrollServiceEnabled = true;

    @Column(name = "connect_service_enabled")
    private Boolean connectServiceEnabled = true;

    @Column(name = "ai_gateway_enabled")
    private Boolean aiGatewayEnabled = true;

    @Column(name = "granted_by")
    private UUID grantedBy;

    @Column(name = "granted_at")
    private LocalDateTime grantedAt;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
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

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        grantedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
