package com.example.sistemarestaurantebackend.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class JwtResponseDTO {
    private String token;
    @Builder.Default
    private String type = "Bearer";
    private Long id;
    private String username;
    private String nombreCompleto;
    private List<String> roles;
}