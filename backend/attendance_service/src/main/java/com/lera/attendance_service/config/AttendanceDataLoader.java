package com.lera.attendance_service.config;

import com.lera.attendance_service.entity.AttendanceRecord;
import com.lera.attendance_service.repository.AttendanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AttendanceDataLoader implements CommandLineRunner {

    private final AttendanceRepository attendanceRepository;
    private final JdbcTemplate jdbcTemplate;
    private final Environment environment;

    @Override
    public void run(String... args) {
        // Demo attendance uses random student UUIDs — never seed it into a deployed environment.
        if (isDeployedProfile()) {
            return;
        }
        // class_sessions is owned by academy_service in the shared DB. On a fresh bootstrap the
        // attendance service can start before academy has created it — skip seeding instead of
        // crashing startup with "relation class_sessions does not exist".
        if (!tableExists("class_sessions")) {
            return;
        }
        if (attendanceRepository.count() == 0) {
            loadSampleAttendanceRecords();
        }
    }

    private boolean isDeployedProfile() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> p.equalsIgnoreCase("prod")
                        || p.equalsIgnoreCase("docker")
                        || p.equalsIgnoreCase("staging"));
    }

    private boolean tableExists(String table) {
        Long n = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.tables where table_schema='public' and table_name=?",
                Long.class, table);
        return n != null && n > 0;
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
