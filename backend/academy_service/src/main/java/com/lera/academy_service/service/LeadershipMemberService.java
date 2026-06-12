package com.lera.academy_service.service;
import com.lera.academy_service.entity.LeadershipMember;
import com.lera.academy_service.repository.LeadershipMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class LeadershipMemberService {
    private final LeadershipMemberRepository repo;
    public Page<LeadershipMember> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<LeadershipMember> getById(UUID id) { return repo.findById(id); }
    @Transactional public LeadershipMember save(LeadershipMember e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
