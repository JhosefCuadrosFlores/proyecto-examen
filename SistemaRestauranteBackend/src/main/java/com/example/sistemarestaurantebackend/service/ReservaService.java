package com.example.sistemarestaurantebackend.service;

import com.example.sistemarestaurantebackend.models.Reserva;

import java.util.List;

public interface ReservaService {

    long contarReservasPendientes(Long usuarioId);

    List<Reserva> listarProximasReservas(Long usuarioId);
}