package com.example.sistemarestaurantebackend.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime; // Cambiar a LocalDateTime

@Entity
@Table(name = "reservas")
@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Usuario usuario;

    @ManyToOne
    private Menu menu;

    private LocalDateTime fechaReserva; // Cambiar a LocalDateTime

    @Enumerated(EnumType.STRING)
    private EstadoReserva estado;

    private Integer cantidad;

    private Double total;

    private String nombreCliente;

    private String metodoPago;

    private String numeroOperacion;
}