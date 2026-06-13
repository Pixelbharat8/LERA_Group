package com.lera.academy_service.service;
import com.lera.academy_service.entity.CmsSetting;
import com.lera.academy_service.repository.CmsSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class CmsSettingService {
    private final CmsSettingRepository repo;
    public Page<CmsSetting> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<CmsSetting> getById(UUID id) { return repo.findById(id); }
    @Transactional public CmsSetting save(CmsSetting e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
