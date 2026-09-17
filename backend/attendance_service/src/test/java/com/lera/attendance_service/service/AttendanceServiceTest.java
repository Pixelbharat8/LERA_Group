package com.lera.attendance_service.service;

import com.lera.attendance_service.entity.AttendanceRecord;
import com.lera.attendance_service.repository.AttendanceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @InjectMocks
    private AttendanceService attendanceService;

    private AttendanceRecord testRecord;
    private UUID studentId;
    private UUID sessionId;

    @BeforeEach
    void setUp() {
        studentId = UUID.randomUUID();
        sessionId = UUID.randomUUID();

        testRecord = new AttendanceRecord();
        testRecord.setId(UUID.randomUUID());
        testRecord.setStudentId(studentId);
        testRecord.setSessionId(sessionId);
        testRecord.setStatus("PRESENT");
        testRecord.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void getAllAttendance_shouldReturnPage() {
        Page<AttendanceRecord> page = new PageImpl<>(List.of(testRecord));
        when(attendanceRepository.findAll(any(PageRequest.class))).thenReturn(page);

        Page<AttendanceRecord> result = attendanceService.getAllAttendance(PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getAttendanceByStudent_shouldReturnRecords() {
        when(attendanceRepository.findByStudentIdOrderByCreatedAtDesc(studentId))
                .thenReturn(List.of(testRecord));

        List<AttendanceRecord> result = attendanceService.getAttendanceByStudent(studentId);
        assertEquals(1, result.size());
        assertEquals(studentId, result.get(0).getStudentId());
    }

    @Test
    void getAttendanceById_shouldReturnRecord() {
        when(attendanceRepository.findById(testRecord.getId())).thenReturn(Optional.of(testRecord));

        Optional<AttendanceRecord> result = attendanceService.getAttendanceById(testRecord.getId());
        assertTrue(result.isPresent());
        assertEquals("PRESENT", result.get().getStatus());
    }

    @Test
    void getStudentStats_shouldCalculateCorrectly() {
        when(attendanceRepository.countPresentByStudent(studentId)).thenReturn(8L);
        when(attendanceRepository.countAbsentByStudent(studentId)).thenReturn(2L);
        when(attendanceRepository.findByStudentIdOrderByCreatedAtDesc(studentId))
                .thenReturn(List.of(testRecord, testRecord, testRecord, testRecord, testRecord,
                        testRecord, testRecord, testRecord, testRecord, testRecord));

        Map<String, Object> stats = attendanceService.getStudentStats(studentId);
        assertEquals(8L, stats.get("presentCount"));
        assertEquals(2L, stats.get("absentCount"));
        assertEquals(10, stats.get("totalRecords"));
        assertEquals(80.0, stats.get("attendanceRate"));
    }

    @Test
    void createAttendance_shouldSaveRecord() {
        when(attendanceRepository.existsByStudentIdAndSessionId(studentId, sessionId)).thenReturn(false);
        when(attendanceRepository.save(any(AttendanceRecord.class))).thenReturn(testRecord);

        AttendanceRecord result = attendanceService.createAttendance(testRecord);
        assertNotNull(result);
        verify(attendanceRepository).save(testRecord);
    }

    @Test
    void deleteAttendance_shouldReturnTrueWhenExists() {
        when(attendanceRepository.existsById(testRecord.getId())).thenReturn(true);
        
        assertTrue(attendanceService.deleteAttendance(testRecord.getId()));
        verify(attendanceRepository).deleteById(testRecord.getId());
    }

    @Test
    void deleteAttendance_shouldReturnFalseWhenNotExists() {
        UUID randomId = UUID.randomUUID();
        when(attendanceRepository.existsById(randomId)).thenReturn(false);

        assertFalse(attendanceService.deleteAttendance(randomId));
        verify(attendanceRepository, never()).deleteById(any());
    }

    // ---- the register belongs to students ----

    /**
     * student_id is nullable in the schema, so a body shaped for something else saved happily.
     * The staff attendance page posted {userId, date, checkInTime, checkOutTime, status, notes} —
     * userId and date are not fields on this entity, so what was stored was a row belonging to no
     * student and no session, and the page reported "✅ Attendance marked successfully!".
     *
     * Those orphans then counted towards student attendance figures, which is why this is refused
     * rather than tidied up afterwards.
     */
    @Test
    void anAttendanceRecordWithNoStudent_isRefused() {
        AttendanceRecord orphan = new AttendanceRecord();
        orphan.setStatus("PRESENT");
        orphan.setCheckInTime(LocalDateTime.now());

        assertThrows(IllegalArgumentException.class,
                () -> attendanceService.createAttendance(orphan));
        verify(attendanceRepository, never()).save(any());
    }

    @Test
    void aBulkRosterWithAnUnnamedStudent_isRefusedWhole() {
        AttendanceRecord good = new AttendanceRecord();
        good.setStudentId(UUID.randomUUID());
        good.setSessionId(sessionId);
        AttendanceRecord orphan = new AttendanceRecord();
        orphan.setSessionId(sessionId);

        assertThrows(IllegalArgumentException.class,
                () -> attendanceService.createBulkAttendance(List.of(good, orphan)));
        verify(attendanceRepository, never()).saveAll(any());
    }
}