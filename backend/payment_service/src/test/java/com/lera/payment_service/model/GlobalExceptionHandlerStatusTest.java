package com.lera.payment_service.model;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Locks in the client-error -> 4xx contract added to {@link GlobalExceptionHandler}: Spring MVC
 * binding/method/body exceptions must map to the correct status (400/405/415), not the catch-all
 * 500. Uses a standalone DispatcherServlet (no Spring context / DB) so it is fast and independent
 * of the web-slice security infrastructure.
 */
class GlobalExceptionHandlerStatusTest {

    @RestController
    static class ProbeController {
        @GetMapping("/needs-param")
        String needsParam(@RequestParam String q) { return q; }

        @GetMapping("/needs-uuid/{id}")
        String needsUuid(@PathVariable UUID id) { return id.toString(); }

        @PostMapping("/needs-body")
        String needsBody(@RequestBody List<String> body) { return String.valueOf(body.size()); }
    }

    private final MockMvc mvc = MockMvcBuilders
            .standaloneSetup(new ProbeController())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

    @Test
    void missingRequiredParam_returns400() throws Exception {
        mvc.perform(get("/needs-param")).andExpect(status().isBadRequest());
    }

    @Test
    void invalidPathVariableType_returns400() throws Exception {
        mvc.perform(get("/needs-uuid/not-a-uuid")).andExpect(status().isBadRequest());
    }

    @Test
    void malformedOrWrongTypeBody_returns400() throws Exception {
        // an object where a JSON array is expected -> HttpMessageNotReadableException
        mvc.perform(post("/needs-body").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void wrongHttpMethod_returns405() throws Exception {
        mvc.perform(delete("/needs-param")).andExpect(status().isMethodNotAllowed());
    }

    @Test
    void unsupportedContentType_returns415() throws Exception {
        mvc.perform(post("/needs-body").contentType(MediaType.TEXT_PLAIN).content("hello"))
                .andExpect(status().isUnsupportedMediaType());
    }
}
