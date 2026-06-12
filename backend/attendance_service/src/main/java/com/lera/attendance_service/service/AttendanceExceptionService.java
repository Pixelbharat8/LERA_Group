package com.lera.attendance_service.service;

import com.lera.attendance_service.entity.AttendanceException;
import com.lera.attendance_service.repository.AttendanceExceptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AttendanceExceptionService {

    private final AttendanceExceptionRepository attendanceExceptionRepository;

    public Page<AttendanceException> getAll(Pageable pageable) {
        return attendanceExceptionRepository.findAll(pageable);
    }

    public Optional<AttendanceException> getById(UUID id) {
        return attendanceExceptionRepository.findById(id);
    }

    public List<AttendanceException> getByStudent(UUID studentId) {
        return attendanceExceptionRepository.findByStudentId(studentId);
    }

    public List<AttendanceException> getByStatus(String status) {
        return attendanceExceptionRepository.findByStatus(status);
    }

    public List<AttendanceException> getByClass(UUID classId) {
        return attendanceExceptionRepository.findByClassId(classId);
    }

    public List<AttendanceException> getByCenter(UUID centerId) {
        return attendanceExceptionRepository.findByCenterId(centerId);
    }

    @Transactional
    public AttendanceException create(AttendanceException exception) {
        log.info("Creating attendance exception for student: {}", exception.getStudentId());
        return attendanceExceptionRepository.save(exception);
    }

    @Transactional
    public Optional<AttendanceException> update(UUID id, AttendanceException details) {
        return attendanceExceptionRepository.findById(id).map(existing -> {
            details.setId(id);
            return attendanceExceptionRepository.save(details);
        });
    }

    @Transactional
    public Optional<AttendanceException> updateStatus(UUID id, String status) {
        return attendanceExceptionRepository.findById(id).map(exception -> {
            exception.setStatus(status);
            return attendanceExceptionRepository.save(exception);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (attendanceExceptionRepository.existsById(id)) {
            attendanceExceptionRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
