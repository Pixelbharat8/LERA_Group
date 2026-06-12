package com.lera.academy_service.repository;

import com.lera.academy_service.entity.ClassScheduleException;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassScheduleExceptionRepository extends JpaRepository<ClassScheduleException, Long> {

    List<ClassScheduleException> findByClassId(UUID classId);
}
