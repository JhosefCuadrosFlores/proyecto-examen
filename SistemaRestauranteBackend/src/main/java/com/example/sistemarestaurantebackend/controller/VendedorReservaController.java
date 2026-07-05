package com.example.sistemarestaurantebackend.controller;

import com.example.sistemarestaurantebackend.models.Menu;
import com.example.sistemarestaurantebackend.models.Reserva;
import com.example.sistemarestaurantebackend.repository.MenuRepository;
import com.example.sistemarestaurantebackend.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendedor-reservas")
@RequiredArgsConstructor
public class VendedorReservaController {

    private final ReservaRepository reservaRepository;
    private final MenuRepository menuRepository;

    @GetMapping("/vendedor/{vendedorId}")
    public ResponseEntity<List<Reserva>> listarPorVendedor(@PathVariable Long vendedorId) {
        List<Long> menuIds = menuRepository.findByVendedorId(vendedorId).stream()
                .map(Menu::getId)
                .toList();

        Map<Long, Reserva> unicas = new LinkedHashMap<>();

        if (!menuIds.isEmpty()) {
            reservaRepository.findByMenuIdInOrderByFechaReservaDesc(menuIds)
                    .forEach(r -> unicas.putIfAbsent(r.getId(), r));
        }

        reservaRepository.findByMenuVendedorIdOrderByFechaReservaDesc(vendedorId)
                .forEach(r -> unicas.putIfAbsent(r.getId(), r));

        List<Reserva> reservas = new ArrayList<>(unicas.values());
        reservas.sort(Comparator.comparing(Reserva::getFechaReserva, Comparator.nullsLast(Comparator.reverseOrder())));

        return ResponseEntity.ok(reservas);
    }
}
