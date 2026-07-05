package com.example.sistemarestaurantebackend.repository;

import com.example.sistemarestaurantebackend.models.Boleta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoletaRepository extends JpaRepository<Boleta, Long> {
    List<Boleta> findByVendedorId(Long vendedorId);
    boolean existsByReservaId(Long reservaId);
}
