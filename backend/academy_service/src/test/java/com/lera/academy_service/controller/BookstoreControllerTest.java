package com.lera.academy_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lera.academy_service.entity.BookstoreProduct;
import com.lera.academy_service.repository.BookstoreOrderRepository;
import com.lera.academy_service.repository.BookstoreProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookstoreControllerTest {

    @Mock private BookstoreProductRepository products;
    @Mock private BookstoreOrderRepository orders;
    @Mock private ObjectMapper objectMapper;
    @InjectMocks private BookstoreController controller;

    @Test
    void adjustStock_nonNumericValue_returns400NotServerError() {
        UUID id = UUID.randomUUID();
        when(products.findById(id)).thenReturn(Optional.of(new BookstoreProduct()));

        ResponseEntity<BookstoreProduct> resp = controller.adjustStock(id, Map.of("stock", "abc"));

        assertEquals(400, resp.getStatusCode().value());
        verify(products, never()).save(any());
    }

    @Test
    void adjustStock_validDelta_appliesToCurrentStock() {
        UUID id = UUID.randomUUID();
        BookstoreProduct p = new BookstoreProduct();
        p.setStock(5);
        when(products.findById(id)).thenReturn(Optional.of(p));
        when(products.save(any())).thenAnswer(i -> i.getArgument(0));

        ResponseEntity<BookstoreProduct> resp = controller.adjustStock(id, Map.of("delta", "3"));

        assertEquals(200, resp.getStatusCode().value());
        assertEquals(8, resp.getBody().getStock());
    }

    @Test
    void adjustStock_missingProduct_returns404() {
        UUID id = UUID.randomUUID();
        when(products.findById(id)).thenReturn(Optional.empty());

        ResponseEntity<BookstoreProduct> resp = controller.adjustStock(id, Map.of("stock", "10"));

        assertEquals(404, resp.getStatusCode().value());
    }
}
