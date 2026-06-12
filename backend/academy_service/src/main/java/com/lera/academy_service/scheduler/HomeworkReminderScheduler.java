package com.lera.academy_service.scheduler;

import com.lera.academy_service.client.NotificationClient;
import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.LessonPlan;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.LessonPlanRepository;
import com.lera.academy_service.repository.StudentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Reminds enrolled students that homework set in a lesson plan is due soon (default: tomorrow).
 * Notifies the student's own user account via the existing NotificationClient.
 */
@Component
@Slf4j
public class HomeworkReminderScheduler {

    private final LessonPlanRepository lessonPlans;
    private final EnrollmentRepository enrollments;
    private final StudentRepository students;
    private final ClassRepository classes;
    private final NotificationClient notificationClient;

    @Value("${lera.scheduling.homework-reminders.days-ahead:1}")
    private int daysAhead;

    public HomeworkReminderScheduler(LessonPlanRepository lessonPlans, EnrollmentRepository enrollments,
                                     StudentRepository students, ClassRepository classes,
                                     NotificationClient notificationClient) {
        this.lessonPlans = lessonPlans;
        this.enrollments = enrollments;
        this.students = students;
        this.classes = classes;
        this.notificationClient = notificationClient;
    }

    /** Daily, early evening. */
    @Scheduled(cron = "${lera.scheduling.homework-reminders.cron:0 0 18 * * ?}")
    public void scheduledRun() {
        int sent = runReminders();
        log.info("Homework reminder run: {} reminder(s) sent", sent);
    }

    public int runReminders() {
        LocalDate target = LocalDate.now().plusDays(Math.max(1, daysAhead));
        List<LessonPlan> due = lessonPlans.findByHomeworkDueDateAndHomeworkDescriptionIsNotNull(target);
        int sent = 0;
        for (LessonPlan lp : due) {
            if (lp.getClassId() == null) continue;
            String className = classes.findById(lp.getClassId()).map(ClassEntity::getName).orElse("your class");
            Set<UUID> studentIds = enrollments.findByClassId(lp.getClassId()).stream()
                    .filter(e -> !"WITHDRAWN".equalsIgnoreCase(e.getStatus()) && !"DROPPED".equalsIgnoreCase(e.getStatus()))
                    .map(Enrollment::getStudentId).filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            for (Student s : students.findAllById(studentIds)) {
                UUID uid = s.getUserId();
                if (uid == null) continue;
                try {
                    notificationClient.triggerNotification(Map.of(
                            "notificationType", "TASK_ASSIGNED",
                            "userId", uid,
                            "title", "Homework due " + target,
                            "message", "Homework for " + className + " is due " + target + ": "
                                    + truncate(lp.getHomeworkDescription(), 120),
                            "referenceId", lp.getId()));
                    sent++;
                } catch (Exception ignored) { /* non-blocking */ }
            }
        }
        return sent;
    }

    private static String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
