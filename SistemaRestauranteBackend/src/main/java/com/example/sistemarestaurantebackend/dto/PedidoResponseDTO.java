package com.example.sistemarestaurantebackend.dto;

import com.example.sistemarestaurantebackend.models.PedidoItem;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PedidoResponseDTO {
    private Long id;
    private LocalDateTime creadoEn;
    private Double subtotal;
    private Double total;
    private String metodoPago;
    private List<PedidoItem> items;
    private String comentarios;
    private Long reservaId;
    private String boletaNumero;
}