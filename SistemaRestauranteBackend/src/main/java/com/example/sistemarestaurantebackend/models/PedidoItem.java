package com.example.sistemarestaurantebackend.models;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "pedido_items")
public class PedidoItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long menuId;

    private String menuNombre;

    private Double precioUnitario;

    private Integer cantidad;

    private Double subtotal;

    @ManyToOne
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;
}