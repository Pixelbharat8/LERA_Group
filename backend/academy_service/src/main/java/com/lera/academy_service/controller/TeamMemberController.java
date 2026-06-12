package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.TeamMember;
import com.lera.academy_service.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/team-members")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class TeamMemberController {

    private final TeamMemberRepository teamMemberRepository;

    @GetMapping
    public ResponseEntity<List<TeamMember>> getAll(Pageable pageable) {
        return ResponseEntity.ok(teamMemberRepository.findAll(pageable).getContent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamMember> getById(@PathVariable UUID id) {
        return teamMemberRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TeamMember> create(@Valid @RequestBody TeamMember teamMember) {
        return ResponseEntity.ok(teamMemberRepository.save(teamMember));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamMember> update(@PathVariable UUID id, @Valid @RequestBody TeamMember teamMember) {
        return teamMemberRepository.findById(id)
                .map(existing -> {
                    teamMember.setId(id);
                    return ResponseEntity.ok(teamMemberRepository.save(teamMember));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (teamMemberRepository.existsById(id)) {
            teamMemberRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
