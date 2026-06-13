package com.lera.connect_service.repository;

import com.lera.connect_service.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByAssigneeIdOrderByDueDateAsc(UUID assigneeId);
    List<Task> findByAssigneeIdAndStatusOrderByDueDateAsc(UUID assigneeId, String status);
    List<Task> findByCenterIdOrderByDueDateAsc(UUID centerId);
    List<Task> findByStatusOrderByDueDateAsc(String status);
    List<Task> findByClassIdOrderByDueDateAsc(UUID classId);
    long countByAssigneeIdAndStatus(UUID assigneeId, String status);
}
