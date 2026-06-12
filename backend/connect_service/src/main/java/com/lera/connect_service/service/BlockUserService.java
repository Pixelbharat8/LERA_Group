package com.lera.connect_service.service;

import com.lera.connect_service.entity.BlockedUser;
import com.lera.connect_service.repository.BlockedUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class BlockUserService {
    private final BlockedUserRepository repo;

    public List<BlockedUser> getByBlocker(UUID blockerId) { return repo.findByBlockerId(blockerId); }
    public List<BlockedUser> getByBlocked(UUID blockedId) { return repo.findByBlockedId(blockedId); }
    public Optional<BlockedUser> getByBlockerAndBlocked(UUID blockerId, UUID blockedId) { return repo.findByBlockerIdAndBlockedId(blockerId, blockedId); }

    @Transactional public BlockedUser save(BlockedUser entity) { return repo.save(entity); }
    @Transactional public void unblock(UUID blockerId, UUID blockedId) { repo.deleteByBlockerIdAndBlockedId(blockerId, blockedId); }
}
