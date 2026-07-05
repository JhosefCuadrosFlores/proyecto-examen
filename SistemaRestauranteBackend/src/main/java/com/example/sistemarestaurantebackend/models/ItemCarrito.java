package com.example.sistemarestaurantebackend.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "items_carrito")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ItemCarrito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Carrito carrito;

    @ManyToOne
    private Menu menu;

    private Integer cantidad;

    private Double subtotal;
}
