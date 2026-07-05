package com.example.sistemarestaurantebackend.controller;


import com.example.sistemarestaurantebackend.dto.JwtResponseDTO;
import com.example.sistemarestaurantebackend.dto.LoginRequestDTO;
import com.example.sistemarestaurantebackend.dto.RegisterRequestDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.sistemarestaurantebackend.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponseDTO> authenticateUser(@Valid @RequestBody LoginRequestDTO loginRequest) {
        return ResponseEntity.ok(authService.loginUser(loginRequest));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequestDTO registerRequest) {
        return authService.registerUser(registerRequest);
    }
}
