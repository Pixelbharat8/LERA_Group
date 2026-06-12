package com.lera.attendance_service.service;

import com.lera.attendance_service.dto.ClassSessionSyncRequest;
import com.lera.attendance_service.dto.StudentAttendanceSync;
import com.lera.attendance_service.entity.AttendanceRecord;
import com.lera.attendance_service.entity.TeacherSession;
import com.lera.attendance_service.repository.AttendanceRepository;
import com.lera.attendance_service.repository.TeacherSessionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClassSessionSyncService {

    private final TeacherSessionRepository teacherSessionRepository;
    private final AttendanceRepository attendanceRepository;

    @Transactional
    public TeacherSession syncCompletedClassSession(ClassSessionSyncRequest request) {
        TeacherSession session = teacherSessionRepository
                .findByClassSessionId(request.getClassSessionId())
                .orElseGet(TeacherSession::new);

        session.setClassSessionId(request.getClassSessionId());
        session.setClassId(request.getClassId());
        if (request.getTeacherId() != null) {
            session.setTeacherId(request.getTeacherId());
        } else if (session.getTeacherId() == null) {
            throw new IllegalArgumentException("teacherId is required for class session sync");
        }
        session.setSessionDate(request.getSessionDate());
        session.setStatus("COMPLETED");
        session.setSessionType("REGULAR");

        LocalDateTime start = request.getSessionDate().atTime(
                request.getStartTime() != null ? request.getStartTime() : java.time.LocalTime.of(9, 0));
        LocalDateTime end = request.getSessionDate().atTime(
                request.getEndTime() != null ? request.getEndTime() : java.time.LocalTime.of(10, 30));
        session.setStartTime(start);
        session.setEndTime(end);
        long minutes = java.time.Duration.between(start, end).toMinutes();
        session.setDurationHours(
                BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP));

        List<StudentAttendanceSync> rows =
                request.getAttendance() != null ? request.getAttendance() : List.of();
        int present = (int) rows.stream()
                .filter(r -> isPresentish(r.getStatus()))
                .count();
        session.setStudentsAttended(present);

        TeacherSession saved = teacherSessionRepository.save(session);
        UUID payrollSessionId = saved.getId();
        UUID centerId = request.getCenterId();

        for (StudentAttendanceSync row : rows) {
            AttendanceRecord record = attendanceRepository
                    .findBySessionIdAndStudentId(payrollSessionId, row.getStudentId())
                    .orElseGet(AttendanceRecord::new);
            record.setSessionId(payrollSessionId);
            record.setStudentId(row.getStudentId());
            record.setCenterId(centerId);
            record.setStatus(normalizeStatus(row.getStatus()));
            if (record.getCreatedAt() == null) {
                record.setCreatedAt(LocalDateTime.now());
            }
            attendanceRepository.save(record);
        }

        return saved;
    }

    private static boolean isPresentish(String status) {
        if (status == null) {
            return false;
        }
        String s = status.toUpperCase();
        return "PRESENT".equals(s) || "LATE".equals(s) || "CHECKED_IN".equals(s);
    }

    private static String normalizeStatus(String status) {
        if (status == null) {
            return "ABSENT";
        }
        return switch (status.toUpperCase()) {
            case "PRESENT", "LATE", "EXCUSED", "ABSENT" -> status.toUpperCase();
            case "CHECKED_IN" -> "PRESENT";
            default -> "ABSENT";
        };
    }
}
