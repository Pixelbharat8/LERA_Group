package com.lera.academy_service.controller;

import com.lera.academy_service.entity.BookstoreOrder;
import com.lera.academy_service.entity.BookstoreProduct;
import com.lera.academy_service.repository.BookstoreOrderRepository;
import com.lera.academy_service.repository.BookstoreProductRepository;
import com.lera.academy_service.security.AcademyRoles;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Bookstore products + orders — now DB-backed (was an in-memory stub). Categories are derived
 * from product.category; inventory is product stock.
 */
@RestController
@RequestMapping("/api/bookstore")
@PreAuthorize(AcademyRoles.STAFF)
public class BookstoreController {

    private static final String ADMIN = "hasAnyRole('SUPER_ADMIN','CHAIRMAN','CEO','DIRECTOR','CENTER_MANAGER','ACCOUNTANT')";

    private final BookstoreProductRepository products;
    private final BookstoreOrderRepository orders;
    private final ObjectMapper objectMapper;

    public BookstoreController(BookstoreProductRepository products, BookstoreOrderRepository orders, ObjectMapper objectMapper) {
        this.products = products;
        this.orders = orders;
        this.objectMapper = objectMapper;
    }

    // ---- products ----

    @GetMapping("/products")
    public ResponseEntity<List<BookstoreProduct>> getProducts(@RequestParam(required = false) String category,
                                                              @RequestParam(required = false) Boolean activeOnly) {
        List<BookstoreProduct> list;
        if (category != null && !category.isBlank()) list = products.findByCategoryOrderByNameAsc(category);
        else if (Boolean.TRUE.equals(activeOnly)) list = products.findByActiveTrueOrderByNameAsc();
        else list = products.findAllByOrderByNameAsc();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<BookstoreProduct> getProduct(@PathVariable UUID id) {
        return products.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/products")
    @PreAuthorize(ADMIN)
    public ResponseEntity<BookstoreProduct> createProduct(@Valid @RequestBody BookstoreProduct p) {
        p.setId(null);
        return ResponseEntity.ok(products.save(p));
    }

    @PutMapping("/products/{id}")
    @PreAuthorize(ADMIN)
    public ResponseEntity<BookstoreProduct> updateProduct(@PathVariable UUID id, @Valid @RequestBody BookstoreProduct body) {
        return products.findById(id).map(p -> {
            p.setName(body.getName());
            p.setDescription(body.getDescription());
            p.setCategory(body.getCategory());
            p.setPrice(body.getPrice());
            p.setStock(body.getStock());
            p.setImage(body.getImage());
            if (body.getActive() != null) p.setActive(body.getActive());
            return ResponseEntity.ok(products.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/products/{id}")
    @PreAuthorize(ADMIN)
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        if (!products.existsById(id)) return ResponseEntity.notFound().build();
        products.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---- categories (derived from products) ----

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> getCategories() {
        List<Map<String, Object>> out = products.distinctCategories().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c);
            m.put("name", c);
            return m;
        }).toList();
        return ResponseEntity.ok(out);
    }

    // ---- orders ----

    @GetMapping("/orders")
    @PreAuthorize(ADMIN)
    public ResponseEntity<List<BookstoreOrder>> getOrders(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(status != null && !status.isBlank()
                ? orders.findByStatusOrderByCreatedAtDesc(status) : orders.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<BookstoreOrder> getOrder(@PathVariable UUID id) {
        return orders.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/orders")
    public ResponseEntity<BookstoreOrder> createOrder(@RequestBody Map<String, Object> req) {
        BookstoreOrder o = new BookstoreOrder();
        o.setCustomerName(req.get("customerName") != null ? req.get("customerName").toString() : null);
        if (req.get("customerId") != null) {
            try { o.setCustomerId(UUID.fromString(req.get("customerId").toString())); } catch (IllegalArgumentException ignored) {}
        }
        if (req.get("total") != null) o.setTotalAmount(new BigDecimal(req.get("total").toString()));
        else if (req.get("totalAmount") != null) o.setTotalAmount(new BigDecimal(req.get("totalAmount").toString()));
        Object items = req.get("items");
        if (items != null) {
            try { o.setItemsJson(objectMapper.writeValueAsString(items)); }
            catch (Exception e) { o.setItemsJson(items.toString()); }
        }
        o.setStatus("PENDING");
        return ResponseEntity.ok(orders.save(o));
    }

    @PostMapping("/orders/{id}/status")
    @PreAuthorize(ADMIN)
    public ResponseEntity<BookstoreOrder> setOrderStatus(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        return orders.findById(id).map(o -> {
            if (body.get("status") != null) {
                o.setStatus(body.get("status").toString());
                if ("FULFILLED".equals(o.getStatus()) || "PAID".equals(o.getStatus())) o.setCompletedAt(java.time.LocalDateTime.now());
            }
            return ResponseEntity.ok(orders.save(o));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/orders/{id}")
    @PreAuthorize(ADMIN)
    public ResponseEntity<Void> deleteOrder(@PathVariable UUID id) {
        if (!orders.existsById(id)) return ResponseEntity.notFound().build();
        orders.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---- inventory (= product stock) ----

    @GetMapping("/inventory")
    public ResponseEntity<List<BookstoreProduct>> inventory() {
        return ResponseEntity.ok(products.findAllByOrderByNameAsc());
    }

    @PostMapping("/inventory/{productId}/adjust")
    @PreAuthorize(ADMIN)
    public ResponseEntity<BookstoreProduct> adjustStock(@PathVariable UUID productId, @RequestBody Map<String, Object> body) {
        return products.findById(productId).map(p -> {
            int cur = p.getStock() != null ? p.getStock() : 0;
            if (body.get("stock") != null) p.setStock(Integer.parseInt(body.get("stock").toString()));
            else if (body.get("delta") != null) p.setStock(cur + Integer.parseInt(body.get("delta").toString()));
            return ResponseEntity.ok(products.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---- stats ----

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        List<BookstoreProduct> all = products.findAllByOrderByNameAsc();
        BigDecimal inventoryValue = all.stream()
                .filter(p -> p.getPrice() != null && p.getStock() != null)
                .map(p -> p.getPrice().multiply(BigDecimal.valueOf(p.getStock())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("totalProducts", all.size());
        s.put("totalCategories", products.distinctCategories().size());
        s.put("totalOrders", orders.count());
        s.put("pendingOrders", orders.countByStatus("PENDING"));
        s.put("lowStock", products.countByStockLessThan(5));
        s.put("totalInventoryValue", inventoryValue);
        return ResponseEntity.ok(s);
    }
}
