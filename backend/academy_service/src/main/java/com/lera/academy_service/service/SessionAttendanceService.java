package com.lera.academy_service.service;

import com.lera.academy_service.entity.SessionAttendance;
import com.lera.academy_service.repository.SessionAttendanceRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SessionAttendanceService {

    private final SessionAttendanceRepository repository;

    @Transactional
    public List<SessionAttendance> upsertBulk(List<SessionAttendance> rows) {
        List<SessionAttendance> saved = new ArrayList<>();
        for (SessionAttendance row : rows) {
            if (row.getSessionId() == null || row.getStudentId() == null) {
                continue;
            }
            SessionAttendance target = repository
                    .findBySessionIdAndStudentId(row.getSessionId(), row.getStudentId())
                    .map(existing -> {
                        existing.setStatus(row.getStatus() != null ? row.getStatus() : "PRESENT");
                        if (row.getNotes() != null) {
                            existing.setNotes(row.getNotes());
                        }
                        if (row.getCheckInTime() != null) {
                            existing.setCheckInTime(row.getCheckInTime());
                        }
                        return existing;
                    })
                    .orElseGet(() -> {
                        SessionAttendance created = new SessionAttendance();
                        created.setSessionId(row.getSessionId());
                        created.setStudentId(row.getStudentId());
                        created.setStatus(row.getStatus() != null ? row.getStatus() : "PRESENT");
                        created.setNotes(row.getNotes());
                        created.setCheckInTime(row.getCheckInTime());
                        created.setRecordedAt(LocalDateTime.now());
                        return created;
                    });
            saved.add(repository.save(target));
        }
        return saved;
    }
}
