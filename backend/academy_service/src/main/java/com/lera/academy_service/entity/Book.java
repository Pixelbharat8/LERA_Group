package com.lera.academy_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "books")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Book {
    @Id
    private String id;
    
    @Column(nullable = false, length = 500)
    private String title;
    
    @Column(name = "title_vi", length = 500)
    private String titleVi;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(length = 20, unique = true)
    private String isbn;
    
    @Column(name = "author_id", length = 36)
    private String authorId;
    
    @Column(name = "category_id", length = 36)
    private String categoryId;
    
    @Column(name = "publisher_id", length = 36)
    private String publisherId;
    
    @Column(name = "publication_year")
    private Integer publicationYear;
    
    private String edition;
    private String language;
    private Integer pages;
    private Double price;
    
    @Column(name = "total_copies", nullable = false)
    private Integer totalCopies;
    
    @Column(name = "available_copies", nullable = false)
    private Integer availableCopies;
    
    private String location;
    
    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;
    
    @Column(name = "is_active")
    private Boolean isActive;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (id == null) id = java.util.UUID.randomUUID().toString();
        createdAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
        if (availableCopies == null) availableCopies = totalCopies;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
