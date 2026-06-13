package com.lera.academy_service.service;

import com.lera.academy_service.entity.ClassSchedule;
import com.lera.academy_service.repository.ClassScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ClassScheduleService {

    private final ClassScheduleRepository classScheduleRepository;

    public ClassSchedule createSchedule(ClassSchedule schedule) {
        Objects.requireNonNull(schedule, "schedule must not be null");
        return Objects.requireNonNull(classScheduleRepository.save(schedule));
    }

    public Optional<ClassSchedule> getScheduleById(UUID id) {
        Objects.requireNonNull(id, "id must not be null");
        return classScheduleRepository.findById(id);
    }

    public List<ClassSchedule> getSchedulesByClass(UUID classId) {
        Objects.requireNonNull(classId, "classId must not be null");
        return classScheduleRepository.findByClassId(classId);
    }

    public List<ClassSchedule> getSchedulesByDay(String dayOfWeek) {
        return classScheduleRepository.findByDayOfWeek(dayOfWeek);
    }

    public ClassSchedule updateSchedule(UUID id, ClassSchedule scheduleDetails) {
        Objects.requireNonNull(id, "id must not be null");
        ClassSchedule schedule = classScheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found"));

        schedule.setDayOfWeek(scheduleDetails.getDayOfWeek());
        schedule.setStartTime(scheduleDetails.getStartTime());
        schedule.setEndTime(scheduleDetails.getEndTime());
        schedule.setRoomNumber(scheduleDetails.getRoomNumber());
        schedule.setRoomName(scheduleDetails.getRoomName());
        schedule.setLocation(scheduleDetails.getLocation());
        schedule.setIsOnline(scheduleDetails.getIsOnline());
        schedule.setMeetingLink(scheduleDetails.getMeetingLink());
        schedule.setMeetingId(scheduleDetails.getMeetingId());
        schedule.setMeetingPassword(scheduleDetails.getMeetingPassword());
        schedule.setNotes(scheduleDetails.getNotes());
        schedule.setIsActive(scheduleDetails.getIsActive());

        return Objects.requireNonNull(classScheduleRepository.save(schedule));
    }

    public void deleteSchedule(UUID id) {
        Objects.requireNonNull(id, "id must not be null");
        classScheduleRepository.deleteById(id);
    }
}
