package com.lera.attendance_service.service;

import com.lera.attendance_service.entity.TeacherSession;
import com.lera.attendance_service.repository.TeacherSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeacherSessionService {
    
    private final TeacherSessionRepository teacherSessionRepository;
    
    public List<TeacherSession> getAllSessions() {
        return teacherSessionRepository.findAll();
    }
    
    public List<TeacherSession> getSessionsByTeacher(UUID teacherId) {
        return teacherSessionRepository.findByTeacherId(teacherId);
    }

    public List<TeacherSession> getSessionsByClass(UUID classId) {
        return teacherSessionRepository.findByClassIdOrderBySessionDateDesc(classId);
    }
    
    public List<TeacherSession> getSessionsByTeacherAndDateRange(
            UUID teacherId, LocalDate startDate, LocalDate endDate) {
        return teacherSessionRepository.findByTeacherIdAndSessionDateBetween(
                teacherId, startDate, endDate);
    }
    
    public BigDecimal getTotalHoursForPeriod(UUID teacherId, LocalDate startDate, LocalDate endDate) {
        BigDecimal total = teacherSessionRepository.getTotalHoursForPeriod(teacherId, startDate, endDate);
        return total != null ? total : BigDecimal.ZERO;
    }
    
    public TeacherSession createSession(TeacherSession session) {
        return teacherSessionRepository.save(session);
    }
    
    public TeacherSession updateSession(UUID id, TeacherSession session) {
        if (teacherSessionRepository.existsById(id)) {
            session.setId(id);
            return teacherSessionRepository.save(session);
        }
        throw new RuntimeException("Teacher session not found with id: " + id);
    }
}
