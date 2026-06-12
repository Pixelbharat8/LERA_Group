package com.lera.academy_service.service;
import com.lera.academy_service.entity.*;
import com.lera.academy_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
@Service @RequiredArgsConstructor
public class TeacherProfileService {
    private final TeacherRepository teacherRepository;
    private final ClassRepository classRepository;
    private final TeacherDocumentRepository teacherDocumentRepository;

    public Optional<Teacher> getTeacherById(UUID id) { return teacherRepository.findById(id); }
    public List<ClassEntity> getClassesByTeacherId(UUID teacherId) {
        return classRepository.findByTeacherId(teacherId);
    }
    public List<TeacherDocument> getDocumentsByTeacherId(UUID teacherId) {
        return teacherDocumentRepository.findByTeacherId(teacherId);
    }
}
