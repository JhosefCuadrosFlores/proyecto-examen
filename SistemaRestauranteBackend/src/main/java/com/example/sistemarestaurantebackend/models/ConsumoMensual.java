package com.example.sistemarestaurantebackend.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "consumo_mensual")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ConsumoMensual {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Usuario usuario;

    private int mes;

    private int año;

    private Double totalGastado;
}
