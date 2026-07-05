package com.example.sistemarestaurantebackend.service;

import com.example.sistemarestaurantebackend.models.Carrito;
import org.springframework.stereotype.Service;

@Service
public interface CarritoService {

    Carrito obtenerCarrito(Long usuarioId);

    Carrito agregarAlCarrito(Long usuarioId, Long menuId);

    void vaciarCarrito(Long usuarioId);

    double calcularTotal(Long carritoId);
}
