package com.lera.academy_service.service;

import com.lera.academy_service.client.NotificationClient;
import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.ClassSession;
import com.lera.academy_service.entity.Enrollment;
import com.lera.academy_service.entity.Student;
import com.lera.academy_service.repository.EnrollmentRepository;
import com.lera.academy_service.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Resolves class roster + staff recipients and sends Connect notifications for
 * schedule/course/teacher changes and cancellations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClassRosterNotificationService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final NotificationClient notificationClient;

    private static boolean isCancelledStatus(String status) {
        if (status == null) return false;
        String u = status.trim().toUpperCase();
        return "CANCELLED".equals(u) || "CANCELED".equals(u) || "CANCEL".equals(u);
    }

    /**
     * Teachers, enrolled students (user accounts), and linked parents.
     */
    public List<UUID> resolveRecipientUserIds(UUID classId, UUID teacherId, UUID assistantTeacherId) {
        Set<UUID> ids = new LinkedHashSet<>();
        if (teacherId != null) ids.add(teacherId);
        if (assistantTeacherId != null) ids.add(assistantTeacherId);
        if (classId == null) return new ArrayList<>(ids);

        List<Enrollment> enrollments = enrollmentRepository.findByClassId(classId);
        for (Enrollment e : enrollments) {
            if (e.getStatus() != null && !"ACTIVE".equalsIgnoreCase(e.getStatus())) continue;
            Optional<Student> st = studentRepository.findById(e.getStudentId());
            if (st.isEmpty()) continue;
            Student s = st.get();
            if (s.getUserId() != null) ids.add(s.getUserId());
            if (s.getParentId() != null) ids.add(s.getParentId());
        }
        return new ArrayList<>(ids);
    }

    public void notifyScheduleChange(ClassEntity cls, String changeDescription) {
        if (cls == null || changeDescription == null || changeDescription.isBlank()) return;
        List<UUID> ids = resolveRecipientUserIds(cls.getId(), cls.getTeacherId(), cls.getAssistantTeacherId());
        if (ids.isEmpty()) {
            log.debug("No recipients for schedule notification class={}", cls.getId());
            return;
        }
        notificationClient.notifyClassScheduleChange(ids, cls.getName(), changeDescription, cls.getId());
    }

    public void notifyClassCancelled(ClassEntity cls, String reason) {
        if (cls == null) return;
        List<UUID> ids = resolveRecipientUserIds(cls.getId(), cls.getTeacherId(), cls.getAssistantTeacherId());
        if (ids.isEmpty()) return;
        String date = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        notificationClient.notifyClassCancelled(ids, cls.getName(), date, reason, cls.getId());
    }

    /** Single session cancelled (distinct from whole class cancelled). */
    public void notifySessionCancelled(ClassEntity cls, ClassSession session, String reason) {
        if (cls == null || session == null) return;
        List<UUID> ids = resolveRecipientUserIds(cls.getId(), cls.getTeacherId(), cls.getAssistantTeacherId());
        if (ids.isEmpty()) return;
        LocalDate d = session.getSessionDate() != null ? session.getSessionDate() : LocalDate.now();
        String dateStr = d.format(DateTimeFormatter.ISO_LOCAL_DATE);
        String msg = String.format(
                "Session on %s for %s was cancelled.%s",
                dateStr,
                cls.getName(),
                reason != null && !reason.isBlank() ? " " + reason : ""
        );
        String msgVi = String.format(
                "Buổi học ngày %s (lớp %s) đã bị hủy.%s",
                dateStr,
                cls.getName(),
                reason != null && !reason.isBlank() ? " " + reason : ""
        );
        notificationClient.notifyCustomMultiUser(
                ids,
                "Class session cancelled",
                "Buổi học bị hủy",
                msg,
                msgVi,
                "warning",
                "class_session",
                session.getId()
        );
    }

    /**
     * After a class entity update: notify if program, teacher, or embedded schedule fields changed.
     */
    public void onClassEntityUpdated(ClassEntity before, ClassEntity after) {
        if (before == null || after == null) return;
        List<String> parts = new ArrayList<>();
        if (!Objects.equals(before.getProgramId(), after.getProgramId())) {
            parts.add("course/program assignment updated");
        }
        if (!Objects.equals(before.getTeacherId(), after.getTeacherId())) {
            parts.add("teacher assignment updated");
        }
        if (!Objects.equals(before.getAssistantTeacherId(), after.getAssistantTeacherId())) {
            parts.add("assistant teacher updated");
        }
        if (!Objects.equals(before.getScheduleDays(), after.getScheduleDays())
                || !Objects.equals(before.getScheduleTimeStart(), after.getScheduleTimeStart())
                || !Objects.equals(before.getScheduleTimeEnd(), after.getScheduleTimeEnd())) {
            parts.add("weekly schedule or times updated");
        }
        if (!Objects.equals(before.getRoom(), after.getRoom())) {
            parts.add("room updated");
        }
        if (parts.isEmpty()) return;
        notifyScheduleChange(after, String.join("; ", parts));
    }

    public void onClassStatusChanged(ClassEntity cls, String previousStatus, String newStatus) {
        if (cls == null || newStatus == null) return;
        if (isCancelledStatus(newStatus) && !isCancelledStatus(previousStatus)) {
            notifyClassCancelled(cls, null);
        }
    }

    public static ClassEntity snapshot(ClassEntity e) {
        return ClassEntity.builder()
                .id(e.getId())
                .centerId(e.getCenterId())
                .programId(e.getProgramId())
                .levelId(e.getLevelId())
                .name(e.getName())
                .teacherId(e.getTeacherId())
                .assistantTeacherId(e.getAssistantTeacherId())
                .room(e.getRoom())
                .scheduleDays(e.getScheduleDays())
                .scheduleTimeStart(e.getScheduleTimeStart())
                .scheduleTimeEnd(e.getScheduleTimeEnd())
                .startDate(e.getStartDate())
                .endDate(e.getEndDate())
                .maxStudents(e.getMaxStudents())
                .status(e.getStatus())
                .build();
    }
}
