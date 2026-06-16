package com.lera.academy_service.controller;

import com.lera.academy_service.security.AcademyRoles;
import com.lera.academy_service.entity.Faq;
import com.lera.academy_service.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/faqs")
@RequiredArgsConstructor
@PreAuthorize(AcademyRoles.STAFF)
public class FaqController {

    private final FaqRepository faqRepository;

    // Get all FAQs (admin)
    @GetMapping
    public ResponseEntity<List<Faq>> getAllFaqs() {
        return ResponseEntity.ok(faqRepository.findAllByOrderByDisplayOrderAsc());
    }

    // Get active FAQs (public website)
    @GetMapping("/public")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<Faq>> getActiveFaqs() {
        return ResponseEntity.ok(faqRepository.findByIsActiveTrueOrderByDisplayOrderAsc());
    }

    // Get FAQs by page (contact, courses, about, etc.)
    @GetMapping("/page/{page}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<Faq>> getFaqsByPage(@PathVariable String page) {
        return ResponseEntity.ok(faqRepository.findByPageAndIsActiveTrueOrderByDisplayOrderAsc(page));
    }

    // Get single FAQ
    @GetMapping("/{id}")
    public ResponseEntity<Faq> getFaqById(@PathVariable UUID id) {
        return faqRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create FAQ
    @PostMapping
    public ResponseEntity<Faq> createFaq(@Valid @RequestBody Faq faq) {
        return ResponseEntity.ok(faqRepository.save(faq));
    }

    // Update FAQ
    @PutMapping("/{id}")
    public ResponseEntity<Faq> updateFaq(@PathVariable UUID id, @Valid @RequestBody Faq faqDetails) {
        return faqRepository.findById(id).map(faq -> {
            if (faqDetails.getQuestion() != null) faq.setQuestion(faqDetails.getQuestion());
            if (faqDetails.getQuestionVI() != null) faq.setQuestionVI(faqDetails.getQuestionVI());
            if (faqDetails.getAnswer() != null) faq.setAnswer(faqDetails.getAnswer());
            if (faqDetails.getAnswerVI() != null) faq.setAnswerVI(faqDetails.getAnswerVI());
            if (faqDetails.getPage() != null) faq.setPage(faqDetails.getPage());
            if (faqDetails.getCategory() != null) faq.setCategory(faqDetails.getCategory());
            if (faqDetails.getDisplayOrder() != null) faq.setDisplayOrder(faqDetails.getDisplayOrder());
            if (faqDetails.getIsActive() != null) faq.setIsActive(faqDetails.getIsActive());

            return ResponseEntity.ok(faqRepository.save(faq));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Delete FAQ
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFaq(@PathVariable UUID id) {
        if (faqRepository.existsById(id)) {
            faqRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Bulk save FAQs
    @PostMapping("/bulk")
    public ResponseEntity<List<Faq>> saveAllFaqs(@Valid @RequestBody List<Faq> faqs) {
        return ResponseEntity.ok(faqRepository.saveAll(faqs));
    }
}
