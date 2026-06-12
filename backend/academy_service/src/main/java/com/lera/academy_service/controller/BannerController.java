package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.Banner;
import com.lera.academy_service.repository.BannerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/api/banners")
@PreAuthorize(AcademyRoles.STAFF)
public class BannerController {
    
    @Autowired
    private BannerRepository bannerRepository;
    
    @GetMapping
    public List<Banner> getAllBanners(Pageable pageable) {
        return bannerRepository.findAll(pageable).getContent();
    }
    
    @GetMapping("/active")
    public List<Banner> getActiveBanners() {
        return bannerRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }
    
    @GetMapping("/position/{position}")
    public List<Banner> getBannersByPosition(@PathVariable String position) {
        return bannerRepository.findByPositionOrderByDisplayOrderAsc(position);
    }
    
    @GetMapping("/position/{position}/active")
    public List<Banner> getActiveBannersByPosition(@PathVariable String position) {
        return bannerRepository.findByPositionAndIsActiveTrueOrderByDisplayOrderAsc(position);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Banner> getBannerById(@PathVariable UUID id) {
        return bannerRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Banner> createBanner(@Valid @RequestBody Banner banner) {
        return ResponseEntity.ok(bannerRepository.save(banner));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Banner> updateBanner(@PathVariable UUID id, @Valid @RequestBody Banner updatedBanner) {
        return bannerRepository.findById(id).map(banner -> {
            banner.setTitle(updatedBanner.getTitle());
            banner.setTitleVi(updatedBanner.getTitleVi());
            banner.setSubtitle(updatedBanner.getSubtitle());
            banner.setSubtitleVi(updatedBanner.getSubtitleVi());
            banner.setImageUrl(updatedBanner.getImageUrl());
            banner.setImageUrlMobile(updatedBanner.getImageUrlMobile());
            banner.setLinkUrl(updatedBanner.getLinkUrl());
            banner.setButtonText(updatedBanner.getButtonText());
            banner.setButtonTextVi(updatedBanner.getButtonTextVi());
            banner.setPosition(updatedBanner.getPosition());
            banner.setDisplayOrder(updatedBanner.getDisplayOrder());
            banner.setStartDate(updatedBanner.getStartDate());
            banner.setEndDate(updatedBanner.getEndDate());
            banner.setIsActive(updatedBanner.getIsActive());
            return ResponseEntity.ok(bannerRepository.save(banner));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable UUID id) {
        if (bannerRepository.existsById(id)) {
            bannerRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
