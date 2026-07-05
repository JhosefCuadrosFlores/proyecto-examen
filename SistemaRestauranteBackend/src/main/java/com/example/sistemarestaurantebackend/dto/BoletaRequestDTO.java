package com.example.sistemarestaurantebackend.dto;

import lombok.Data;

import java.util.List;

@Data
public class BoletaRequestDTO {
    private String codigoEstudiante;
    private String nombreEstudiante;
    private Long menuId;
    private Integer cantidad; // Número de items
    private List<Long> extrasIds; // IDs de extras seleccionados
    private String metodoPago; // Yape / Plin / Tarjeta / Efectivo
    private String pagadorNombre; // nombre que retorna la pasarela (Yape/Plin)
    private String pagadorCuenta; // opcional
    private Double monto; // opcional; si es null, se calcula basado en menu, cantidad y extras
}