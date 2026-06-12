package com.lera.connect_service.service;

import com.lera.connect_service.entity.AssignmentSubmission;
import com.lera.connect_service.repository.AssignmentSubmissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AssignmentService {
    private final AssignmentSubmissionRepository repo;

    public Page<AssignmentSubmission> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<AssignmentSubmission> getById(UUID id) { return repo.findById(id); }
    public List<AssignmentSubmission> getByAssignment(UUID assignmentId) { return repo.findByAssignmentId(assignmentId); }
    public List<AssignmentSubmission> getByStudent(UUID studentId) { return repo.findByStudentId(studentId); }
    public Optional<AssignmentSubmission> getByAssignmentAndStudent(UUID assignmentId, UUID studentId) { return repo.findByAssignmentIdAndStudentId(assignmentId, studentId); }

    @Transactional public AssignmentSubmission save(AssignmentSubmission entity) { return repo.save(entity); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
