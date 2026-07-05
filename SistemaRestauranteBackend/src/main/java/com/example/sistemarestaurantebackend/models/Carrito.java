package com.example.sistemarestaurantebackend.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "carritos")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Carrito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    private Usuario usuario;

    private Double total;
}
