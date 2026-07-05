package com.example.sistemarestaurantebackend.dto;

import lombok.Data;

@Data
public class RegisterRequestDTO {
    private String nombreCompleto;
    private String username;
    private String password;
    private String rol; // "vendedor" o "admin"
}