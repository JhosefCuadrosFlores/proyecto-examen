package com.example.sistemarestaurantebackend.controller;

import com.example.sistemarestaurantebackend.models.EstadoReserva;
import com.example.sistemarestaurantebackend.models.Reserva;
import com.example.sistemarestaurantebackend.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaRepository reservaRepository;

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<Reserva>> listarPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(reservaRepository.findByUsuarioIdOrderByFechaReservaDesc(usuarioId));
    }
    
    // Endpoint temporal para ver TODAS las reservas
    @GetMapping("/todas")
    public ResponseEntity<List<Reserva>> listarTodas() {
        return ResponseEntity.ok(reservaRepository.findAll());
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<Reserva> actualizarEstado(@PathVariable Long id, @RequestParam String estado) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        reserva.setEstado(EstadoReserva.valueOf(estado.toUpperCase()));
        return ResponseEntity.ok(reservaRepository.save(reserva));
    }
}
