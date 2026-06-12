package com.lera.academy_service.repository;

import com.lera.academy_service.entity.LessonPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface LessonPlanRepository extends JpaRepository<LessonPlan, UUID> {

    List<LessonPlan> findByClassId(UUID classId);

    List<LessonPlan> findByTeacherId(UUID teacherId);

    List<LessonPlan> findByTeacherIdAndPlanDateBetween(UUID teacherId, LocalDate startDate, LocalDate endDate);

    List<LessonPlan> findByClassIdAndPlanDateBetween(UUID classId, LocalDate startDate, LocalDate endDate);

    List<LessonPlan> findByClassIdAndTeacherId(UUID classId, UUID teacherId);

    List<LessonPlan> findByPlanDate(LocalDate planDate);

    /** Lesson plans whose homework is due on a given date and that actually have homework set. */
    List<LessonPlan> findByHomeworkDueDateAndHomeworkDescriptionIsNotNull(LocalDate homeworkDueDate);

    List<LessonPlan> findByStatus(String status);

    List<LessonPlan> findByTeacherIdAndStatus(UUID teacherId, String status);

    List<LessonPlan> findByCurriculumId(UUID curriculumId);

    List<LessonPlan> findByModuleId(UUID moduleId);

    List<LessonPlan> findByLessonId(UUID lessonId);

    List<LessonPlan> findBySessionId(UUID sessionId);

    List<LessonPlan> findByCenterId(UUID centerId);

    List<LessonPlan> findByCenterIdAndPlanDateBetween(UUID centerId, LocalDate startDate, LocalDate endDate);

    List<LessonPlan> findByClassIdOrderByPlanDateAsc(UUID classId);

    List<LessonPlan> findByTeacherIdOrderByPlanDateDesc(UUID teacherId);

    List<LessonPlan> findByTermAndClassId(String term, UUID classId);

    List<LessonPlan> findByGradeLevel(String gradeLevel);

    long countByTeacherIdAndStatus(UUID teacherId, String status);

    long countByClassId(UUID classId);

    @Query("SELECT lp FROM LessonPlan lp WHERE lp.teacherId = ?1 AND lp.planDate >= ?2 ORDER BY lp.planDate ASC")
    List<LessonPlan> findUpcomingByTeacher(UUID teacherId, LocalDate fromDate);

    @Query("SELECT lp FROM LessonPlan lp WHERE lp.classId = ?1 AND lp.planDate >= ?2 ORDER BY lp.planDate ASC")
    List<LessonPlan> findUpcomingByClass(UUID classId, LocalDate fromDate);
}
