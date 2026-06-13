package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "banners")
@Data
public class Banner {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "title")
    private String title;
    
    @Column(name = "title_vi")
    private String titleVi;
    
    @Column(name = "subtitle", columnDefinition = "TEXT")
    private String subtitle;
    
    @Column(name = "subtitle_vi", columnDefinition = "TEXT")
    private String subtitleVi;
    
    @Column(name = "image_url", columnDefinition = "TEXT", nullable = false)
    private String imageUrl;
    
    @Column(name = "image_url_mobile", columnDefinition = "TEXT")
    private String imageUrlMobile;
    
    @Column(name = "link_url", columnDefinition = "TEXT")
    private String linkUrl;
    
    @Column(name = "button_text")
    private String buttonText;
    
    @Column(name = "button_text_vi")
    private String buttonTextVi;
    
    @Column(name = "position")
    private String position = "homepage";
    
    @Column(name = "display_order")
    private Integer displayOrder = 0;
    
    @Column(name = "start_date")
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
