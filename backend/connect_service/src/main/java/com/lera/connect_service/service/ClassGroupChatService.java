package com.lera.connect_service.service;

import com.lera.connect_service.entity.ClassGroupChat;
import com.lera.connect_service.repository.ClassGroupChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ClassGroupChatService {
    private final ClassGroupChatRepository repo;

    public Page<ClassGroupChat> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<ClassGroupChat> getById(UUID id) { return repo.findById(id); }
    public List<ClassGroupChat> getByAcademy(UUID academyId) { return repo.findByAcademyId(academyId); }
    public Optional<ClassGroupChat> getByClass(UUID classId) { return repo.findByClassId(classId); }
    public List<ClassGroupChat> getActiveByAcademy(UUID academyId) { return repo.findByAcademyIdAndIsActiveTrue(academyId); }
    public List<ClassGroupChat> getByType(String type) { return repo.findByGroupType(type); }

    @Transactional public ClassGroupChat save(ClassGroupChat entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
