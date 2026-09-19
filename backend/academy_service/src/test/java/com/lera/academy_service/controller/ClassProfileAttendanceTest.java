package com.lera.academy_service.controller;

import com.lera.academy_service.entity.ClassEntity;
import com.lera.academy_service.entity.ClassSession;
import com.lera.academy_service.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * "Low attendance days" used to be derived by calling findBySessionId once per session and
 * counting PRESENT rows in memory — 120 queries for a term, each pulling every attendance row
 * for that session, to produce one number per session. It is now a single grouped query.
 *
 * The subtle part, and the reason this test exists: a session nobody attended does not appear
 * in a GROUP BY result at all. The old loop counted it (0 present is below any threshold); a
 * naive rewrite that iterates the query result instead of the session list silently stops
 * counting exactly the worst sessions.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ClassProfileAttendanceTest {

    @Mock private ClassRepository classRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    @Mock private ClassSessionRepository classSessionRepository;
    @Mock private AssignmentRepository assignmentRepository;
    @Mock private SessionAttendanceRepository sessionAttendanceRepository;
    @Mock private ExamRepository examRepository;

    @InjectMocks private ClassProfileController controller;

    private final UUID classId = UUID.randomUUID();

    private ClassSession session(UUID id) {
        ClassSession s = new ClassSession();
        s.setId(id);
        s.setStatus("COMPLETED");
        return s;
    }

    private Map<String, Object> profileWith(List<UUID> sessionIds, long activeEnrollments,
                                            List<Object[]> presentRows) {
        when(classRepository.findById(classId)).thenReturn(Optional.of(new ClassEntity()));
        when(enrollmentRepository.countActiveEnrollmentsByClassId(classId)).thenReturn(activeEnrollments);
        when(classSessionRepository.findByClassId(classId))
                .thenReturn(sessionIds.stream().map(this::session).toList());
        when(assignmentRepository.findByClassIdAndAssignmentType(any(), any())).thenReturn(List.of());
        when(examRepository.findByClassId(classId)).thenReturn(List.of());
        when(enrollmentRepository.findByClassId(classId)).thenReturn(List.of());
        when(sessionAttendanceRepository.countPresentBySessionIds(any())).thenReturn(presentRows);
        return controller.getClassProfile(classId).getBody();
    }

    @Test
    void aSessionNobodyAttendedStillCountsAsLowAttendance() {
        UUID attended = UUID.randomUUID(), empty = UUID.randomUUID();
        // 10 enrolled; `attended` had 8 present (fine), `empty` returns no row at all
        Map<String, Object> profile = profileWith(List.of(attended, empty), 10L,
                List.<Object[]>of(new Object[]{attended, 8L}));

        assertEquals(1L, profile.get("lowAttendanceDays"),
                "the session with no attendance rows is the one that matters most");
    }

    @Test
    void countsASessionBelowHalfAndNotOneAboveIt() {
        UUID low = UUID.randomUUID(), high = UUID.randomUUID();
        Map<String, Object> profile = profileWith(List.of(low, high), 10L,
                List.<Object[]>of(new Object[]{low, 4L}, new Object[]{high, 6L}));

        assertEquals(1L, profile.get("lowAttendanceDays"));
    }

    @Test
    void asksOnceForTheWholeTermRatherThanOncePerSession() {
        List<UUID> term = new ArrayList<>();
        for (int i = 0; i < 120; i++) term.add(UUID.randomUUID());
        profileWith(term, 10L, List.<Object[]>of());

        verify(sessionAttendanceRepository, times(1)).countPresentBySessionIds(any());
        verify(sessionAttendanceRepository, never()).findBySessionId(any());
    }
}
