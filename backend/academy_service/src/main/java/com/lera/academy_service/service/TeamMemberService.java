package com.lera.academy_service.service;
import com.lera.academy_service.entity.TeamMember;
import com.lera.academy_service.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class TeamMemberService {
    private final TeamMemberRepository repo;
    public Page<TeamMember> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<TeamMember> getById(UUID id) { return repo.findById(id); }
    @Transactional public TeamMember save(TeamMember e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
