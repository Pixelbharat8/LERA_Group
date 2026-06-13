package com.lera.academy_service.repository;

import com.lera.academy_service.entity.ClassSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ClassScheduleRepository extends JpaRepository<ClassSchedule, UUID> {
    List<ClassSchedule> findByClassId(UUID classId);
    List<ClassSchedule> findByDayOfWeek(String dayOfWeek);

    @Query("SELECT cs FROM ClassSchedule cs WHERE cs.classId = :classId AND cs.dayOfWeek = :dayOfWeek")
    List<ClassSchedule> findByClassIdAndDayOfWeek(UUID classId, String dayOfWeek);

    @Query("SELECT cs FROM ClassSchedule cs WHERE cs.classId = :classId AND cs.startTime <= :endTime AND cs.endTime >= :startTime")
    List<ClassSchedule> findScheduleConflicts(UUID classId, LocalTime startTime, LocalTime endTime);
}
