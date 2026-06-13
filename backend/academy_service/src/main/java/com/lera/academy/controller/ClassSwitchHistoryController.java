package com.lera.academy.controller;

import com.lera.academy.entity.ClassSwitchHistory;
import com.lera.academy.repository.ClassSwitchHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/class-switch")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','TEACHER','STAFF','STUDENT','PARENT')")
public class ClassSwitchHistoryController {
    
    private final ClassSwitchHistoryRepository classSwitchHistoryRepository;
    
    // Get class switch history for a student
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<ClassSwitchHistory>> getStudentClassSwitchHistory(@PathVariable UUID studentId) {
        return ResponseEntity.ok(classSwitchHistoryRepository.findByStudentIdOrderBySwitchedAtDesc(studentId));
    }
    
    // Get class switch history for students leaving a class
    @GetMapping("/from-class/{classId}")
    public ResponseEntity<List<ClassSwitchHistory>> getClassSwitchHistoryFromClass(@PathVariable UUID classId) {
        return ResponseEntity.ok(classSwitchHistoryRepository.findByOldClassIdOrderBySwitchedAtDesc(classId));
    }
    
    // Get class switch history for students joining a class
    @GetMapping("/to-class/{classId}")
    public ResponseEntity<List<ClassSwitchHistory>> getClassSwitchHistoryToClass(@PathVariable UUID classId) {
        return ResponseEntity.ok(classSwitchHistoryRepository.findByNewClassIdOrderBySwitchedAtDesc(classId));
    }
    
    // Get class switch history by date range
    @GetMapping("/student/{studentId}/range")
    public ResponseEntity<List<ClassSwitchHistory>> getStudentClassSwitchHistoryByDateRange(
            @PathVariable UUID studentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        return ResponseEntity.ok(classSwitchHistoryRepository.findByStudentIdAndDateRange(studentId, start, end));
    }
    
    // Record a class switch
    @PostMapping
    public ResponseEntity<ClassSwitchHistory> recordClassSwitch(@Valid @RequestBody ClassSwitchHistory classSwitchHistory) {
        ClassSwitchHistory saved = classSwitchHistoryRepository.save(classSwitchHistory);
        log.info("Recorded class switch for student {} from {} to {}", 
            classSwitchHistory.getStudentId(), 
            classSwitchHistory.getOldClassName(), 
            classSwitchHistory.getNewClassName());
        return ResponseEntity.ok(saved);
    }
    
    // Get class switch count for a student
    @GetMapping("/student/{studentId}/count")
    public ResponseEntity<Map<String, Long>> getClassSwitchCount(@PathVariable UUID studentId) {
        long count = classSwitchHistoryRepository.countByStudentId(studentId);
        return ResponseEntity.ok(Map.of("count", count));
    }
}
