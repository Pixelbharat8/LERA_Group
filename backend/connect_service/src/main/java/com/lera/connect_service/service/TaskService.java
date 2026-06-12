package com.lera.connect_service.service;

import com.lera.connect_service.entity.Task;
import com.lera.connect_service.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository taskRepository;

    public Page<Task> getAll(Pageable pageable) {
        return taskRepository.findAll(pageable);
    }

    public Optional<Task> getById(UUID id) {
        return taskRepository.findById(id);
    }

    @Transactional
    public Task create(Task task) {
        log.info("Creating task: {}", task.getTitle());
        return taskRepository.save(task);
    }

    @Transactional
    public Optional<Task> update(UUID id, Task details) {
        return taskRepository.findById(id).map(existing -> {
            details.setId(id);
            return taskRepository.save(details);
        });
    }

    @Transactional
    public boolean delete(UUID id) {
        if (taskRepository.existsById(id)) {
            taskRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
