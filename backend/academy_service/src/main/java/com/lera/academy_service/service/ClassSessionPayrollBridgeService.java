package com.lera.academy_service.service;

import com.lera.academy_service.client.AttendanceSyncClient;
import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.ClassSession;
import com.lera.academy_service.entity.SessionAttendance;
import com.lera.academy_service.repository.ClassRepository;
import com.lera.academy_service.repository.SessionAttendanceRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ClassSessionPayrollBridgeService {

    private final ClassRepository classRepository;
    private final SessionAttendanceRepository sessionAttendanceRepository;
    private final AttendanceSyncClient attendanceSyncClient;

    public void syncIfCompleted(ClassSession session) {
        if (session == null || session.getId() == null || session.getStatus() == null) {
            return;
        }
        if (!"COMPLETED".equalsIgnoreCase(session.getStatus())) {
            return;
        }

        ClassEntity cls = classRepository.findById(session.getClassId()).orElse(null);
        if (cls == null) {
            return;
        }

        UUID teacherId = session.getTeacherId() != null ? session.getTeacherId() : cls.getTeacherId();
        if (teacherId == null) {
            return;
        }

        List<SessionAttendance> rows = sessionAttendanceRepository.findBySessionId(session.getId());
        List<Map<String, Object>> attendance = new ArrayList<>();
        for (SessionAttendance row : rows) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("studentId", row.getStudentId());
            entry.put("status", row.getStatus() != null ? row.getStatus() : "ABSENT");
            attendance.add(entry);
        }

        Map<String, Object> payload = AttendanceSyncClient.buildPayload(
                session.getId(),
                session.getClassId(),
                teacherId,
                cls.getCenterId(),
                session.getSessionDate(),
                session.getStartTime(),
                session.getEndTime(),
                attendance);
        attendanceSyncClient.syncCompletedClassSession(payload);
    }
}
