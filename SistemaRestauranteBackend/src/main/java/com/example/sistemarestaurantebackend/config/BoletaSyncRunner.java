package com.example.sistemarestaurantebackend.config;

import com.example.sistemarestaurantebackend.models.Boleta;
import com.example.sistemarestaurantebackend.models.Reserva;
import com.example.sistemarestaurantebackend.repository.BoletaRepository;
import com.example.sistemarestaurantebackend.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Order(2)
@RequiredArgsConstructor
public class BoletaSyncRunner implements CommandLineRunner {

    private final ReservaRepository reservaRepository;
    private final BoletaRepository boletaRepository;

    @Override
    public void run(String... args) {
        for (Reserva reserva : reservaRepository.findAll()) {
            if (reserva.getId() == null || boletaRepository.existsByReservaId(reserva.getId())) {
                continue;
            }
            if (reserva.getMenu() == null) {
                continue;
            }

            Boleta boleta = new Boleta();
            boleta.setNumero("BOL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            if (reserva.getUsuario() != null) {
                boleta.setEstudianteCodigo(reserva.getUsuario().getUsername());
            } else {
                boleta.setEstudianteCodigo("GUEST");
            }
            boleta.setEstudianteNombre(
                    reserva.getNombreCliente() != null ? reserva.getNombreCliente() : "Cliente"
            );
            boleta.setMenu(reserva.getMenu());
            boleta.setMetodoPago(reserva.getMetodoPago() != null ? reserva.getMetodoPago() : "Yape");
            boleta.setPagadorNombre(boleta.getEstudianteNombre());
            boleta.setPagadorCuenta(reserva.getNumeroOperacion());
            boleta.setMonto(reserva.getTotal());
            boleta.setReservaId(reserva.getId());
            if (reserva.getMenu().getVendedor() != null) {
                boleta.setVendedor(reserva.getMenu().getVendedor());
            }
            boletaRepository.save(boleta);
        }
    }
}
