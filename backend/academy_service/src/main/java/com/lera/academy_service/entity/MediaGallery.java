package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "media_gallery")
@Data
public class MediaGallery {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "name", nullable = false)
    private String name;
    
    @Column(name = "file_url", nullable = false)
    private String fileUrl;
    
    @Column(name = "thumbnail_url")
    private String thumbnailUrl;
    
    @Column(name = "media_type")
    private String mediaType = "image"; // image, video, document
    
    @Column(name = "mime_type")
    private String mimeType;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Column(name = "file_size_formatted")
    private String fileSizeFormatted;
    
    @Column(name = "alt_text")
    private String altText;
    
    @Column(name = "alt_text_vi")
    private String altTextVi;
    
    @Column(name = "caption")
    private String caption;
    
    @Column(name = "caption_vi")
    private String captionVi;
    
    @Column(name = "category")
    private String category; // hero, courses, testimonials, blog, etc.
    
    @Column(name = "tags")
    private String tags; // comma-separated tags
    
    @Column(name = "used_in")
    private String usedIn; // comma-separated list of page references
    
    @Column(name = "is_public")
    private Boolean isPublic = true;
    
    @Column(name = "display_order")
    private Integer displayOrder = 0;
    
    @Column(name = "uploaded_by")
    private UUID uploadedBy;
    
    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
