package com.lera.attendance_service.service;

import com.lera.attendance_service.entity.AttendanceRecord;
import com.lera.attendance_service.entity.TeacherSession;
import com.lera.attendance_service.repository.AttendanceRepository;
import com.lera.attendance_service.repository.TeacherSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final TeacherSessionRepository teacherSessionRepository;

    public Page<AttendanceRecord> getAllAttendance(Pageable pageable) {
        return attendanceRepository.findAll(pageable);
    }

    @Cacheable(value = "attendance", key = "'student-' + #studentId")
    public List<AttendanceRecord> getAttendanceByStudent(UUID studentId) {
        return attendanceRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
    }

    @Cacheable(value = "attendance", key = "'center-' + #centerId")
    public List<AttendanceRecord> getAttendanceByCenter(UUID centerId) {
        return attendanceRepository.findByCenterIdOrderByCreatedAtDesc(centerId);
    }

    public List<AttendanceRecord> getAttendanceByMarkedBy(UUID markedBy) {
        return attendanceRepository.findByMarkedByOrderByCreatedAtDesc(markedBy);
    }

    public List<AttendanceRecord> getAttendanceBySession(UUID sessionId) {
        return attendanceRepository.findBySessionId(sessionId);
    }

    public List<AttendanceRecord> getAttendanceByClass(UUID classId) {
        List<UUID> sessionIds = teacherSessionRepository.findByClassIdOrderBySessionDateDesc(classId).stream()
                .map(TeacherSession::getId)
                .toList();
        if (sessionIds.isEmpty()) {
            return List.of();
        }
        return attendanceRepository.findBySessionIdIn(sessionIds);
    }

    @Cacheable(value = "attendance", key = "#id")
    public Optional<AttendanceRecord> getAttendanceById(UUID id) {
        return attendanceRepository.findById(id);
    }

    public Map<String, Object> getStudentStats(UUID studentId) {
        Map<String, Object> stats = new HashMap<>();
        long present = attendanceRepository.countPresentByStudent(studentId);
        long absent = attendanceRepository.countAbsentByStudent(studentId);
        List<AttendanceRecord> records = attendanceRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        stats.put("presentCount", present);
        stats.put("absentCount", absent);
        stats.put("totalRecords", records.size());
        if (!records.isEmpty()) {
            stats.put("attendanceRate", (present * 100.0) / records.size());
        } else {
            stats.put("attendanceRate", 0.0);
        }
        return stats;
    }

    public Map<String, Object> getUserAttendanceSummary(UUID userId, int year) {
        Map<String, Object> summary = new HashMap<>();
        List<AttendanceRecord> records = attendanceRepository.findByStudentIdOrderByCreatedAtDesc(userId);
        List<AttendanceRecord> yearRecords = records.stream()
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().getYear() == year)
                .toList();

        long totalDays = yearRecords.size();
        long presentDays = yearRecords.stream()
                .filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus()) || "CHECKED_IN".equalsIgnoreCase(r.getStatus()))
                .count();
        long absentDays = yearRecords.stream().filter(r -> "ABSENT".equalsIgnoreCase(r.getStatus())).count();
        long lateDays = yearRecords.stream().filter(r -> "LATE".equalsIgnoreCase(r.getStatus())).count();

        Map<String, Map<String, Long>> monthlyStats = new HashMap<>();
        for (int month = 1; month <= 12; month++) {
            final int m = month;
            List<AttendanceRecord> monthRecords = yearRecords.stream()
                    .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().getMonthValue() == m).toList();
            Map<String, Long> ms = new HashMap<>();
            ms.put("total", (long) monthRecords.size());
            ms.put("present", monthRecords.stream()
                    .filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus()) || "CHECKED_IN".equalsIgnoreCase(r.getStatus())).count());
            ms.put("absent", monthRecords.stream().filter(r -> "ABSENT".equalsIgnoreCase(r.getStatus())).count());
            ms.put("late", monthRecords.stream().filter(r -> "LATE".equalsIgnoreCase(r.getStatus())).count());
            monthlyStats.put(String.format("%02d", month), ms);
        }

        summary.put("userId", userId);
        summary.put("year", year);
        summary.put("totalDays", totalDays);
        summary.put("presentDays", presentDays);
        summary.put("absentDays", absentDays);
        summary.put("lateDays", lateDays);
        summary.put("attendanceRate", totalDays > 0 ? (presentDays * 100.0 / totalDays) : 0);
        summary.put("monthlyStats", monthlyStats);
        return summary;
    }

    @CacheEvict(value = "attendance", allEntries = true)
    @Transactional
    public AttendanceRecord createAttendance(AttendanceRecord record) {
        if (attendanceRepository.existsByStudentIdAndSessionId(record.getStudentId(), record.getSessionId())) {
            throw new IllegalStateException("Attendance already marked for this student in this session");
        }
        record.setCreatedAt(LocalDateTime.now());
        log.info("Creating attendance record for student: {}", record.getStudentId());
        return attendanceRepository.save(record);
    }

    @CacheEvict(value = "attendance", allEntries = true)
    @Transactional
    public List<AttendanceRecord> createBulkAttendance(List<AttendanceRecord> records) {
        records.forEach(r -> r.setCreatedAt(LocalDateTime.now()));
        log.info("Creating {} attendance records in bulk", records.size());
        return attendanceRepository.saveAll(records);
    }

    @CacheEvict(value = "attendance", allEntries = true)
    @Transactional
    public AttendanceRecord markSelfAttendance(
            Map<String, Object> request, UUID authUserId, UUID centerId) {
        AttendanceRecord record = new AttendanceRecord();
        record.setStudentId(authUserId);
        record.setMarkedBy(authUserId);
        record.setCenterId(centerId);
        String dateStr = (String) request.get("date");
        LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();
        String checkIn = (String) request.get("checkInTime");
        String checkOut = (String) request.get("checkOutTime");
        if (checkIn != null && !checkIn.isEmpty()) {
            record.setCheckInTime(LocalDateTime.of(date, LocalTime.parse(checkIn)));
        }
        if (checkOut != null && !checkOut.isEmpty()) {
            record.setCheckOutTime(LocalDateTime.of(date, LocalTime.parse(checkOut)));
        }
        record.setStatus((String) request.getOrDefault("status", "PRESENT"));
        record.setNotes((String) request.get("notes"));
        record.setCreatedAt(LocalDateTime.now());
        return attendanceRepository.save(record);
    }

    @Transactional
    public Optional<AttendanceRecord> updateAttendance(UUID id, AttendanceRecord details) {
        return attendanceRepository.findById(id).map(record -> {
            if (details.getStatus() != null) record.setStatus(details.getStatus());
            if (details.getCheckInTime() != null) record.setCheckInTime(details.getCheckInTime());
            if (details.getCheckOutTime() != null) record.setCheckOutTime(details.getCheckOutTime());
            if (details.getNotes() != null) record.setNotes(details.getNotes());
            return attendanceRepository.save(record);
        });
    }

    @Transactional
    public boolean deleteAttendance(UUID id) {
        if (attendanceRepository.existsById(id)) {
            attendanceRepository.deleteById(id);
            return true;
        }
        return false;
    }

    /**
     * Dashboard / report payload. {@code scopedCenterId} {@code null} = all centers (caller must be org-wide).
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAttendanceSummary(UUID scopedCenterId) {
        long total = attendanceRepository.countForOptionalCenter(scopedCenterId);
        long positive = attendanceRepository.countPositiveStatusForOptionalCenter(scopedCenterId);
        long absent = attendanceRepository.countAbsentForOptionalCenter(scopedCenterId);
        long other = Math.max(0L, total - positive - absent);
        double rate = total > 0 ? (positive * 100.0 / total) : 0.0;

        Pageable p = PageRequest.of(0, 5000, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<AttendanceRecord> slice = scopedCenterId == null
                ? attendanceRepository.findAll(p).getContent()
                : attendanceRepository.findByCenterId(scopedCenterId, p).getContent();

        Map<LocalDate, long[]> byDay = new TreeMap<>(Collections.reverseOrder());
        for (AttendanceRecord r : slice) {
            if (r.getCreatedAt() == null) {
                continue;
            }
            LocalDate d = r.getCreatedAt().toLocalDate();
            long[] pa = byDay.computeIfAbsent(d, k -> new long[2]);
            if (isPositiveAttendanceStatus(r.getStatus())) {
                pa[0]++;
            } else if (r.getStatus() != null && "ABSENT".equalsIgnoreCase(r.getStatus())) {
                pa[1]++;
            }
        }
        List<Map<String, Object>> items = new ArrayList<>();
        for (Map.Entry<LocalDate, long[]> e : byDay.entrySet()) {
            long pr = e.getValue()[0];
            long ab = e.getValue()[1];
            long dayTotal = pr + ab;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", e.getKey().toString());
            row.put("className", "—");
            row.put("present", pr);
            row.put("absent", ab);
            row.put("rate", dayTotal > 0 ? Math.round((100.0 * pr) / dayTotal) : 0);
            items.add(row);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("totalCount", total);
        out.put("presentCount", positive);
        out.put("absentCount", absent);
        out.put("otherCount", other);
        out.put("attendanceRate", Math.round(rate * 10.0) / 10.0);
        out.put("items", items);
        return out;
    }

    private static boolean isPositiveAttendanceStatus(String status) {
        if (status == null) {
            return false;
        }
        String u = status.toUpperCase();
        return "PRESENT".equals(u) || "CHECKED_IN".equals(u) || "LATE".equals(u);
    }
}
