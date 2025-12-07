package com.lera.payment_service.model;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ApiResponse<?> handle(Exception ex) {
        return ApiResponse.error(ex.getMessage());
    }
}
