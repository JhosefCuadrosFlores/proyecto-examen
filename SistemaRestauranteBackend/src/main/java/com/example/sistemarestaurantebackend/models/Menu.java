package com.example.sistemarestaurantebackend.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "menus")
@Data
public class Menu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    @Column(length = 1000)
    private String descripcion;

    private Double precio;

    private String horario; // Ej: "Almuerzo" o "Cena"

    @Column(name = "fecha_menu")
    private LocalDate fechaMenu;

    @Column(name = "hora_inicio")
    private String horaInicio; // Ej: "11:00"

    @Column(name = "hora_fin")
    private String horaFin; // Ej: "14:00"

    @Column(name = "imagen_url")
    private String imagenUrl;

    private Integer disponibles;

    private Boolean publicado;

    @ManyToOne
    @JoinColumn(name = "vendedor_id")
    private Usuario vendedor;
}
