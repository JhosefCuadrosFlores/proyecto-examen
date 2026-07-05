package com.example.sistemarestaurantebackend.repository;

import com.example.sistemarestaurantebackend.models.Carrito;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CarritoRepository extends JpaRepository<Carrito, Long> {
    Optional<Carrito> findByUsuarioId(Long usuarioId);
}
