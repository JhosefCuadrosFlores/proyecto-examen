package com.example.sistemarestaurantebackend.dto;

import lombok.Data;

import java.util.List;

@Data
public class ConfirmarReservaDTO {
    private Long usuarioId;      // si cliente no inicia sesión, puede ser null (o 0)
    private Long menuId;
    private Integer cantidad;
    private List<Long> extrasIds; // ids de extras seleccionados
    private String comentarios;
    private String metodoPago;   // "Yape" / "Plin" / "Efectivo"
    private String numeroOperacion; // número de operación del pago
    private String nombreCliente; // nombre de quien recoge el menú
}