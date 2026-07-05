package com.example.sistemarestaurantebackend.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "boletas")
public class Boleta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numero;

    @Column(nullable = false)
    private String estudianteCodigo;

    @Column(nullable = false)
    private String estudianteNombre;

    @ManyToOne
    @JoinColumn(name = "menu_id")
    private Menu menu;

    private String metodoPago; // Yape / Plin / Tarjeta / Efectivo

    private String pagadorNombre; // nombre que aparece en Yape/Plin/Tarjeta

    private String pagadorCuenta; // opcional: número/cuenta identificador del pago

    private Double monto;

    private LocalDateTime creadoEn = LocalDateTime.now();

    private Long reservaId;

    private Long pedidoId;

    @ManyToOne
    @JoinColumn(name = "vendedor_id")
    private Usuario vendedor;
}
