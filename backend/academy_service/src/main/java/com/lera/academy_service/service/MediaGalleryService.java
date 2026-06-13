package com.lera.academy_service.service;
import com.lera.academy_service.entity.MediaGallery;
import com.lera.academy_service.repository.MediaGalleryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class MediaGalleryService {
    private final MediaGalleryRepository repo;
    public Page<MediaGallery> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<MediaGallery> getById(UUID id) { return repo.findById(id); }
    @Transactional public MediaGallery save(MediaGallery e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
