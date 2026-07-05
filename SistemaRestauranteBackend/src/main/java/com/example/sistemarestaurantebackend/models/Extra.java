package com.example.sistemarestaurantebackend.models;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "extras")
public class Extra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    private Double precio;
}