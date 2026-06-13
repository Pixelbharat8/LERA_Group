#!/bin/bash
# Generate all missing academy_service Service classes
BASE="/Users/rahulsharma/LERA_Group/backend/academy_service/src/main/java/com/lera/academy_service/service"
PKG="com.lera.academy_service"

generate_service() {
    local name=$1
    local entity=$2
    local repo="${entity}Repository"
    
    cat > "$BASE/${name}Service.java" << EOF
package ${PKG}.service;

import ${PKG}.entity.${entity};
import ${PKG}.repository.${repo};
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ${name}Service {
    private final ${repo} repo;

    public Page<${entity}> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<${entity}> getById(UUID id) { return repo.findById(id); }

    @Transactional
    public ${entity} save(${entity} entity) { return repo.save(entity); }

    @Transactional
    public void deleteById(UUID id) { repo.deleteById(id); }
}
EOF
    echo "Created ${name}Service.java"
}

# Map: ServiceName -> EntityName
generate_service "Author" "Author"
generate_service "Banner" "Banner"
generate_service "BlogPost" "BlogPost"
generate_service "Book" "Book"
generate_service "BookBorrowing" "BookBorrowing"
generate_service "BookCategory" "BookCategory"
generate_service "BookReservation" "BookReservation"
generate_service "CenterSettings" "CenterSettings"
generate_service "CertificateTemplate" "CertificateTemplate"
generate_service "ClassProfile" "ClassProfile"
generate_service "ClassScheduleException" "ClassScheduleException"
generate_service "ClassSession" "ClassSession"
generate_service "CmsPage" "CmsPage"
generate_service "CmsSetting" "CmsSetting"
generate_service "Curriculum" "Curriculum"
generate_service "EquipmentAssignment" "EquipmentAssignment"
generate_service "Exam" "Exam"
generate_service "ExamResult" "ExamResult"
generate_service "FacilityBooking" "FacilityBooking"
generate_service "Faq" "Faq"
generate_service "FooterSettings" "FooterSettings"
generate_service "Gamification" "Gamification"
generate_service "GpsTracking" "GpsTracking"
generate_service "Grade" "Grade"
generate_service "LeadershipMember" "LeadershipMember"
generate_service "LessonPlan" "LessonPlan"
generate_service "LibraryFine" "LibraryFine"
generate_service "LibraryInventory" "LibraryInventory"
generate_service "MatchEvent" "MatchEvent"
generate_service "MediaGallery" "MediaGallery"
generate_service "PlayerStatistic" "PlayerStatistic"
generate_service "PointTransaction" "PointTransaction"
generate_service "Program" "CourseProgram"
generate_service "Publisher" "Publisher"
generate_service "RouteStop" "RouteStop"
generate_service "Schedule" "Schedule"
generate_service "SessionAttendance" "SessionAttendance"
generate_service "SportEquipment" "SportEquipment"
generate_service "SportFacility" "SportFacility"
generate_service "SportMatch" "SportMatch"
generate_service "SportTeam" "SportTeam"
generate_service "SportTrainingSession" "SportTrainingSession"
generate_service "SportType" "SportType"
generate_service "StudentPoints" "StudentPoints"
generate_service "StudentProfile" "StudentProfile"
generate_service "StudentRegistration" "StudentRegistration"
generate_service "StudentTransport" "StudentTransport"
generate_service "TeacherProfile" "TeacherProfile"
generate_service "TeamMember" "TeamMember"
generate_service "Testimonial" "Testimonial"
generate_service "Tournament" "Tournament"
generate_service "TournamentTeam" "TournamentTeam"
generate_service "TrainingAttendance" "TrainingAttendance"
generate_service "Transport" "Transport"
generate_service "TransportAttendance" "TransportAttendance"
generate_service "TransportDriver" "TransportDriver"
generate_service "TransportRoute" "TransportRoute"
generate_service "TransportSchedule" "TransportSchedule"
generate_service "Vehicle" "Vehicle"
generate_service "VehicleMaintenance" "VehicleMaintenance"

echo ""
echo "=== ALL DONE: $(ls $BASE/*Service.java | wc -l) service files ==="
