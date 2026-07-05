package com.example.sistemarestaurantebackend.repository;

import com.example.sistemarestaurantebackend.models.ItemCarrito;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemCarritoRepository extends JpaRepository<ItemCarrito, Long> {
    List<ItemCarrito> findByCarritoId(Long carritoId);
}