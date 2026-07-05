package com.example.sistemarestaurantebackend.controller;


import com.example.sistemarestaurantebackend.dto.ConfirmarReservaDTO;
import com.example.sistemarestaurantebackend.dto.PedidoResponseDTO;
import com.example.sistemarestaurantebackend.models.Pedido;
import com.example.sistemarestaurantebackend.service.PedidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @PostMapping("/confirmar")
    public ResponseEntity<?> confirmar(@RequestBody ConfirmarReservaDTO dto) {
        try {
            PedidoResponseDTO created = pedidoService.confirmarReserva(dto);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<Pedido>> listarUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(pedidoService.listarPorUsuario(usuarioId));
    }
}