package com.example.sistemarestaurantebackend.service;


import com.example.sistemarestaurantebackend.dto.JwtResponseDTO;
import com.example.sistemarestaurantebackend.dto.LoginRequestDTO;
import com.example.sistemarestaurantebackend.dto.RegisterRequestDTO;
import org.springframework.http.ResponseEntity;

public interface AuthService {
    JwtResponseDTO loginUser(LoginRequestDTO loginRequest);
    ResponseEntity<?> registerUser(RegisterRequestDTO registerRequest);
}