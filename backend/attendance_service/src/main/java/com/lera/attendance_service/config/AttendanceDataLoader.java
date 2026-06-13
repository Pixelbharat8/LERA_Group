package com.lera.attendance_service.config;

import com.lera.attendance_service.entity.AttendanceRecord;
import com.lera.attendance_service.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AttendanceDataLoader implements CommandLineRunner {

    private final AttendanceRepository attendanceRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        if (attendanceRepository.count() == 0) {
            loadSampleAttendanceRecords();
        }
    }

    private void loadSampleAttendanceRecords() {
        // Avoid FK violations: attendance.session_id references public.class_sessions(id)
        Long sessionCount = jdbcTemplate.queryForObject("select count(*) from class_sessions", Long.class);
        if (sessionCount == null || sessionCount == 0) {
            // No sessions to reference yet; skip seeding.
            return;
        }

        String[] statusList = {"PRESENT", "PRESENT", "LATE", "ABSENT", "EXCUSED"};

        // Pick actual session ids from DB (up to 3)
        UUID[] sessionIds = jdbcTemplate.query(
                "select id from class_sessions order by created_at desc nulls last limit 3",
                (rs, rowNum) -> (UUID) rs.getObject("id")
        ).toArray(new UUID[0]);

        if (sessionIds.length == 0) {
            return;
        }

        // Generate sample student IDs (attendance service doesn't own students in this schema)
        UUID[] studentIds = {
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID()
        };

        for (int i = 0; i < studentIds.length; i++) {
            for (UUID sessionId : sessionIds) {
                AttendanceRecord record = AttendanceRecord.builder()
                        .sessionId(sessionId)
                        .studentId(studentIds[i])
                        .status(statusList[i % statusList.length])
                        .checkInTime(LocalDateTime.now().minusHours(2))
                        .checkOutTime(LocalDateTime.now())
                        .notes(statusList[i % statusList.length].equals("LATE") ? "Traffic delay" :
                                statusList[i % statusList.length].equals("ABSENT") ? "No show" :
                                        statusList[i % statusList.length].equals("EXCUSED") ? "Medical leave" : "")
                        .build();

                attendanceRepository.save(record);
            }
        }
    }
}
