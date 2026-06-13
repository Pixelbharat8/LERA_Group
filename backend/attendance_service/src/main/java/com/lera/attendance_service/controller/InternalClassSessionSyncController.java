package com.lera.attendance_service.controller;

import com.lera.attendance_service.dto.ClassSessionSyncRequest;
import com.lera.attendance_service.entity.TeacherSession;
import com.lera.attendance_service.service.ClassSessionSyncService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal/class-session-sync")
@RequiredArgsConstructor
public class InternalClassSessionSyncController {

    private final ClassSessionSyncService classSessionSyncService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> syncCompletedSession(@Valid @RequestBody ClassSessionSyncRequest request) {
        TeacherSession session = classSessionSyncService.syncCompletedClassSession(request);
        return ResponseEntity.ok(Map.of(
                "teacherSessionId", session.getId(),
                "classSessionId", session.getClassSessionId(),
                "studentsAttended", session.getStudentsAttended() != null ? session.getStudentsAttended() : 0));
    }
}
