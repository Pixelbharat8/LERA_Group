package com.lera.academy_service.service;
import com.lera.academy_service.entity.BookReservation;
import com.lera.academy_service.repository.BookReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @RequiredArgsConstructor
public class BookReservationService {
    private final BookReservationRepository repo;
    public Page<BookReservation> getAll(Pageable pageable) { return repo.findAll(pageable); }
    public Optional<BookReservation> getById(UUID id) { return repo.findById(id); }
    @Transactional public BookReservation save(BookReservation e) { return repo.save(e); }
    @Transactional public void deleteById(UUID id) { repo.deleteById(id); }
}
