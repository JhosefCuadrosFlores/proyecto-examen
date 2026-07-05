package com.example.sistemarestaurantebackend.models;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime creadoEn = LocalDateTime.now();

    private Double subtotal;

    private Double total;

    private String metodoPago; // e.g. "Yape", "Plin"

    private String numeroOperacion; // número de operación del pago

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL)
    private List<PedidoItem> items;

    @Column(length = 1000)
    private String comentarios;
}