package com.example.sistemarestaurantebackend.service.impl;

import com.example.sistemarestaurantebackend.models.EstadoReserva;
import com.example.sistemarestaurantebackend.models.Reserva;
import com.example.sistemarestaurantebackend.repository.ReservaRepository;
import com.example.sistemarestaurantebackend.service.ReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservaServiceImpl implements ReservaService {

    private final ReservaRepository reservaRepo;

    @Override
    public long contarReservasPendientes(Long usuarioId) {
        return reservaRepo.countByUsuarioIdAndEstado(usuarioId, EstadoReserva.PENDIENTE);
    }

    @Override
    public List<Reserva> listarProximasReservas(Long usuarioId) {
        return reservaRepo.findByUsuarioId(usuarioId)
                .stream()
                .filter(r -> r.getEstado() == EstadoReserva.PENDIENTE)
                .toList();
    }
}
