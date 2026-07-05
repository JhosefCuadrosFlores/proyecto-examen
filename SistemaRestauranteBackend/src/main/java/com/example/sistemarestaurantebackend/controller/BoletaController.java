package com.example.sistemarestaurantebackend.controller;

import com.example.sistemarestaurantebackend.dto.BoletaRequestDTO;
import com.example.sistemarestaurantebackend.models.Boleta;
import com.example.sistemarestaurantebackend.models.Extra;
import com.example.sistemarestaurantebackend.models.Menu;
import com.example.sistemarestaurantebackend.models.Usuario;
import com.example.sistemarestaurantebackend.repository.BoletaRepository;
import com.example.sistemarestaurantebackend.repository.ExtraRepository;
import com.example.sistemarestaurantebackend.repository.MenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/boletas")
@RequiredArgsConstructor
public class BoletaController {

    private final BoletaRepository boletaRepository;
    private final MenuRepository menuRepository;
    private final ExtraRepository extraRepository;

    @PostMapping("/generar")
    public ResponseEntity<Boleta> generar(@RequestBody BoletaRequestDTO dto) {
        Menu menu = menuRepository.findById(dto.getMenuId())
                .orElseThrow(() -> new RuntimeException("Menú no encontrado"));

        // validar método de pago
        if (!("Yape".equalsIgnoreCase(dto.getMetodoPago()) || "Plin".equalsIgnoreCase(dto.getMetodoPago()) || "Tarjeta".equalsIgnoreCase(dto.getMetodoPago()) || "Efectivo".equalsIgnoreCase(dto.getMetodoPago()))) {
            throw new RuntimeException("Método de pago inválido");
        }

        // Determinar cantidad (por defecto 1 si no se especifica)
        int cantidad = (dto.getCantidad() != null && dto.getCantidad() > 0) ? dto.getCantidad() : 1;

        // Calcular monto total
        double monto;
        if (dto.getMonto() != null) {
            // Usar monto proporcionado si existe
            monto = dto.getMonto();
        } else {
            // Calcular monto basado en menu, cantidad y extras
            double totalMenu = menu.getPrecio() * cantidad;
            
            // Calcular total de extras
            double totalExtras = 0.0;
            if (dto.getExtrasIds() != null && !dto.getExtrasIds().isEmpty()) {
                List<Extra> extras = extraRepository.findAllById(dto.getExtrasIds());
                for (Extra extra : extras) {
                    totalExtras += extra.getPrecio();
                }
            }
            
            monto = totalMenu + totalExtras;
        }

        Boleta b = new Boleta();
        b.setNumero(UUID.randomUUID().toString().substring(0, 12));
        b.setEstudianteCodigo(dto.getCodigoEstudiante());
        b.setEstudianteNombre(dto.getNombreEstudiante());
        b.setMenu(menu);
        b.setMetodoPago(dto.getMetodoPago());
        b.setPagadorNombre(dto.getPagadorNombre());
        b.setPagadorCuenta(dto.getPagadorCuenta());
        b.setMonto(monto);

        Object principal = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Usuario usuario) {
            b.setVendedor(usuario);
        }

        return ResponseEntity.ok(boletaRepository.save(b));
    }

    @GetMapping("/vendedor/{vendedorId}")
    public ResponseEntity<List<Boleta>> listarPorVendedor(@PathVariable Long vendedorId) {
        return ResponseEntity.ok(boletaRepository.findByVendedorId(vendedorId));
    }
}