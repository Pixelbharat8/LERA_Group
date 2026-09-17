package com.lera.academy_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lera.academy_service.entity.BookstoreProduct;
import com.lera.academy_service.model.GlobalExceptionHandler;
import com.lera.academy_service.repository.BookstoreOrderRepository;
import com.lera.academy_service.repository.BookstoreProductRepository;
import com.lera.academy_service.testsupport.WebMvcMethodSecurityTestConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The cart posts each line's price and the total it computed, and the order used to store that
 * total verbatim — the same hole that InvoiceServiceImpl had, where a posted totalAmount of 1
 * against a five-million subtotal was accepted without comment.
 *
 * Orders are staff-only, so this is data integrity rather than a way in: a miskeyed or stale
 * client price produced an order whose recorded value was not what its contents are worth.
 */
@WebMvcTest(controllers = BookstoreController.class)
@Import({ WebMvcMethodSecurityTestConfig.class, GlobalExceptionHandler.class })
class BookstoreOrderPricingWebMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean private BookstoreProductRepository products;
    @MockBean private BookstoreOrderRepository orders;

    private static final UUID PRODUCT_ID = UUID.randomUUID();

    @BeforeEach
    void seedCatalogue() {
        BookstoreProduct book = new BookstoreProduct();
        book.setId(PRODUCT_ID);
        book.setName("Everybody Up 3 — Student Book");
        book.setPrice(new BigDecimal("180000"));
        book.setStock(12);
        when(products.findById(PRODUCT_ID)).thenReturn(Optional.of(book));
        // save() echoes whatever the controller built, so the response shows the stored total
        when(orders.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private String cart(String total, int quantity) {
        return """
               {"items":[{"productId":"%s","name":"Everybody Up 3","price":180000,"quantity":%d}],
                "total":%s}
               """.formatted(PRODUCT_ID, quantity, total);
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void total_isPricedFromTheCatalogue_notFromTheCart() throws Exception {
        mockMvc.perform(post("/api/bookstore/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cart("540000", 3)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount").value(540000));
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void aTotalThatContradictsTheCatalogue_isRejected() throws Exception {
        // three books at 180,000 are worth 540,000 — not 1
        mockMvc.perform(post("/api/bookstore/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cart("1", 3)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void anOrderForSomethingNotOnSale_isRejected() throws Exception {
        UUID unknown = UUID.randomUUID();
        when(products.findById(unknown)).thenReturn(Optional.empty());
        String body = """
                      {"items":[{"productId":"%s","quantity":1}],"total":999}
                      """.formatted(unknown);
        mockMvc.perform(post("/api/bookstore/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    /**
     * The shop gates its "In Stock" label and its Add to Cart button on `inStock`. A product row
     * only stores `stock`, so with the field absent every product read as out of stock and the
     * whole catalogue was unbuyable.
     */
    @Test
    @WithMockUser(roles = "SUPER_ADMIN")
    void products_reportWhetherTheyAreInStock() throws Exception {
        BookstoreProduct inStock = new BookstoreProduct();
        inStock.setId(PRODUCT_ID);
        inStock.setName("Everybody Up 3");
        inStock.setPrice(new BigDecimal("180000"));
        inStock.setStock(12);

        BookstoreProduct soldOut = new BookstoreProduct();
        soldOut.setId(UUID.randomUUID());
        soldOut.setName("LERA hoodie");
        soldOut.setPrice(new BigDecimal("350000"));
        soldOut.setStock(0);

        when(products.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(inStock, soldOut));
        when(products.findAllByOrderByNameAsc()).thenReturn(List.of(inStock, soldOut));

        mockMvc.perform(get("/api/bookstore/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].inStock").value(true))
                .andExpect(jsonPath("$[1].inStock").value(false));
    }
}