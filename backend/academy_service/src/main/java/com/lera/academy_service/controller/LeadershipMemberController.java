package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.LeadershipMember;
import com.lera.academy_service.repository.LeadershipMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leadership-members")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class LeadershipMemberController {
    
    private final LeadershipMemberRepository leadershipMemberRepository;
    
    // Get all leadership members (admin)
    @GetMapping
    public ResponseEntity<List<LeadershipMember>> getAllLeadershipMembers() {
        return ResponseEntity.ok(leadershipMemberRepository.findAllByOrderByDisplayOrderAsc());
    }
    
    // Get active leadership members (public website)
    @GetMapping("/public")
    public ResponseEntity<List<LeadershipMember>> getActiveLeadershipMembers() {
        return ResponseEntity.ok(leadershipMemberRepository.findByIsActiveTrueOrderByDisplayOrderAsc());
    }
    
    // Get single leadership member
    @GetMapping("/{id}")
    public ResponseEntity<LeadershipMember> getLeadershipMemberById(@PathVariable UUID id) {
        return leadershipMemberRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Create leadership member
    @PostMapping
    public ResponseEntity<LeadershipMember> createLeadershipMember(@Valid @RequestBody LeadershipMember member) {
        return ResponseEntity.ok(leadershipMemberRepository.save(member));
    }
    
    // Update leadership member
    @PutMapping("/{id}")
    public ResponseEntity<LeadershipMember> updateLeadershipMember(@PathVariable UUID id, @Valid @RequestBody LeadershipMember memberDetails) {
        return leadershipMemberRepository.findById(id).map(member -> {
            if (memberDetails.getName() != null) member.setName(memberDetails.getName());
            if (memberDetails.getNameVi() != null) member.setNameVi(memberDetails.getNameVi());
            if (memberDetails.getRole() != null) member.setRole(memberDetails.getRole());
            if (memberDetails.getRoleVi() != null) member.setRoleVi(memberDetails.getRoleVi());
            if (memberDetails.getBio() != null) member.setBio(memberDetails.getBio());
            if (memberDetails.getBioVi() != null) member.setBioVi(memberDetails.getBioVi());
            if (memberDetails.getImageUrl() != null) member.setImageUrl(memberDetails.getImageUrl());
            if (memberDetails.getEmail() != null) member.setEmail(memberDetails.getEmail());
            if (memberDetails.getPhone() != null) member.setPhone(memberDetails.getPhone());
            if (memberDetails.getLinkedinUrl() != null) member.setLinkedinUrl(memberDetails.getLinkedinUrl());
            if (memberDetails.getFacebookUrl() != null) member.setFacebookUrl(memberDetails.getFacebookUrl());
            if (memberDetails.getDisplayOrder() != null) member.setDisplayOrder(memberDetails.getDisplayOrder());
            if (memberDetails.getIsActive() != null) member.setIsActive(memberDetails.getIsActive());
            
            return ResponseEntity.ok(leadershipMemberRepository.save(member));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    // Delete leadership member
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLeadershipMember(@PathVariable UUID id) {
        if (leadershipMemberRepository.existsById(id)) {
            leadershipMemberRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // Bulk save leadership members
    @PostMapping("/bulk")
    public ResponseEntity<List<LeadershipMember>> saveAllLeadershipMembers(@Valid @RequestBody List<LeadershipMember> members) {
        return ResponseEntity.ok(leadershipMemberRepository.saveAll(members));
    }
}
