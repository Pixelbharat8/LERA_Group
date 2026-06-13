package com.lera.connect_service.controller;

import com.lera.connect_service.entity.Task;
import com.lera.connect_service.repository.TaskRepository;
import com.lera.connect_service.security.AuthUser;
import com.lera.connect_service.security.ConnectSecurity;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.*;

/**
 * TaskController - manages tasks for TA, Staff, and Teachers
 */
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class TaskController {
    
    private final TaskRepository taskRepository;
    
    @GetMapping
    public ResponseEntity<List<Task>> getTasks(
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) UUID centerId,
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            @AuthenticationPrincipal AuthUser authUser) {
        
        List<Task> tasks;
        UUID effectiveAssignee = ConnectSecurity.effectiveAssigneeId(authUser, assigneeId);
        
        if (status != null) {
            tasks = taskRepository.findByAssigneeIdAndStatusOrderByDueDateAsc(effectiveAssignee, status);
        } else if (classId != null) {
            tasks = taskRepository.findByClassIdOrderByDueDateAsc(classId);
            if (!ConnectSecurity.isOrgWide(authUser)) {
                tasks = tasks.stream()
                        .filter(t -> effectiveAssignee.equals(t.getAssigneeId()))
                        .toList();
            }
        } else if (centerId != null) {
            UUID scopedCenter = ConnectSecurity.effectiveCenterId(authUser, centerId);
            tasks = taskRepository.findByCenterIdOrderByDueDateAsc(scopedCenter);
            if (!ConnectSecurity.isOrgWide(authUser)) {
                tasks = tasks.stream()
                        .filter(t -> effectiveAssignee.equals(t.getAssigneeId()))
                        .toList();
            }
        } else if (role != null) {
            tasks = taskRepository.findByAssigneeIdOrderByDueDateAsc(effectiveAssignee);
        } else {
            tasks = taskRepository.findByAssigneeIdOrderByDueDateAsc(effectiveAssignee);
        }
        
        return ResponseEntity.ok(tasks);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return taskRepository.findById(id)
                .map(t -> {
                    ConnectSecurity.assertCanAccessTask(authUser, t);
                    return ResponseEntity.ok(t);
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/pending/count")
    public ResponseEntity<Map<String, Object>> getPendingCount(
            @RequestParam(required = false) UUID assigneeId,
            @AuthenticationPrincipal AuthUser authUser) {
        
        UUID effectiveAssignee = ConnectSecurity.effectiveAssigneeId(authUser, assigneeId);
        long count = taskRepository.countByAssigneeIdAndStatus(effectiveAssignee, "PENDING");
        
        Map<String, Object> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping
    public ResponseEntity<Task> createTask(
            @Valid @RequestBody Task task,
            @AuthenticationPrincipal AuthUser authUser) {
        if (task.getAssigneeId() == null) {
            task.setAssigneeId(ConnectSecurity.requireUserId(authUser));
        } else {
            task.setAssigneeId(ConnectSecurity.effectiveAssigneeId(authUser, task.getAssigneeId()));
        }
        if (task.getAssignedBy() == null) {
            task.setAssignedBy(ConnectSecurity.requireUserId(authUser));
        }
        return ResponseEntity.ok(taskRepository.save(task));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(
            @PathVariable UUID id,
            @Valid @RequestBody Task taskDetails,
            @AuthenticationPrincipal AuthUser authUser) {
        return taskRepository.findById(id).map(task -> {
            ConnectSecurity.assertCanAccessTask(authUser, task);
            if (taskDetails.getTitle() != null) task.setTitle(taskDetails.getTitle());
            if (taskDetails.getDescription() != null) task.setDescription(taskDetails.getDescription());
            if (taskDetails.getAssigneeId() != null) {
                task.setAssigneeId(ConnectSecurity.effectiveAssigneeId(authUser, taskDetails.getAssigneeId()));
            }
            if (taskDetails.getStatus() != null) {
                task.setStatus(taskDetails.getStatus());
                if ("COMPLETED".equals(taskDetails.getStatus())) {
                    task.setCompletedAt(LocalDateTime.now());
                }
            }
            if (taskDetails.getPriority() != null) task.setPriority(taskDetails.getPriority());
            if (taskDetails.getCategory() != null) task.setCategory(taskDetails.getCategory());
            if (taskDetails.getDueDate() != null) task.setDueDate(taskDetails.getDueDate());
            
            return ResponseEntity.ok(taskRepository.save(task));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/status")
    public ResponseEntity<Task> updateTaskStatus(
            @PathVariable UUID id, 
            @RequestParam String status,
            @AuthenticationPrincipal AuthUser authUser) {
        return taskRepository.findById(id).map(task -> {
            ConnectSecurity.assertCanAccessTask(authUser, task);
            task.setStatus(status);
            if ("COMPLETED".equals(status)) {
                task.setCompletedAt(LocalDateTime.now());
            }
            return ResponseEntity.ok(taskRepository.save(task));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable UUID id,
            @AuthenticationPrincipal AuthUser authUser) {
        return taskRepository.findById(id)
                .map(task -> {
                    ConnectSecurity.assertCanAccessTask(authUser, task);
                    taskRepository.deleteById(id);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
