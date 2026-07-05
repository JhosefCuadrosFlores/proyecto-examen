package com.example.sistemarestaurantebackend.service;

import com.example.sistemarestaurantebackend.models.Usuario;

public interface ConsumoMensualService {
    double obtenerTotalGastadoDelMes(Long usuarioId);
    void registrarConsumo(Usuario usuario, double monto);
}
