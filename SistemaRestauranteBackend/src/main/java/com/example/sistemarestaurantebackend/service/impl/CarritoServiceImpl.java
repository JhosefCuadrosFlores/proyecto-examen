package com.example.sistemarestaurantebackend.service.impl;

import com.example.sistemarestaurantebackend.models.Carrito;
import com.example.sistemarestaurantebackend.models.ItemCarrito;
import com.example.sistemarestaurantebackend.models.Menu;
import com.example.sistemarestaurantebackend.repository.CarritoRepository;
import com.example.sistemarestaurantebackend.repository.ItemCarritoRepository;
import com.example.sistemarestaurantebackend.repository.MenuRepository;
import com.example.sistemarestaurantebackend.repository.UsuarioRepository;
import com.example.sistemarestaurantebackend.service.CarritoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CarritoServiceImpl implements CarritoService {

    private final CarritoRepository carritoRepo;
    private final ItemCarritoRepository itemRepo;
    private final UsuarioRepository usuarioRepo;
    private final MenuRepository menuRepo;

    @Override
    public Carrito obtenerCarrito(Long usuarioId) {
        return carritoRepo.findByUsuarioId(usuarioId)
                .orElseGet(() -> {
                    Carrito nuevo = Carrito.builder()
                            .usuario(usuarioRepo.findById(usuarioId).orElseThrow())
                            .total(0.0)
                            .build();
                    return carritoRepo.save(nuevo);
                });
    }

    @Override
    public Carrito agregarAlCarrito(Long usuarioId, Long menuId) {

        Carrito carrito = obtenerCarrito(usuarioId);

        Menu menu = menuRepo.findById(menuId)
                .orElseThrow(() -> new RuntimeException("Menú no encontrado"));

        ItemCarrito item = ItemCarrito.builder()
                .carrito(carrito)
                .menu(menu)
                .cantidad(1)
                .subtotal(menu.getPrecio())
                .build();

        itemRepo.save(item);

        carrito.setTotal(calcularTotal(carrito.getId()));
        return carritoRepo.save(carrito);
    }

    @Override
    public void vaciarCarrito(Long usuarioId) {
        Carrito carrito = obtenerCarrito(usuarioId);
        itemRepo.deleteAll(itemRepo.findByCarritoId(carrito.getId()));
        carrito.setTotal(0.0);
        carritoRepo.save(carrito);
    }

    @Override
    public double calcularTotal(Long carritoId) {
        return itemRepo.findByCarritoId(carritoId)
                .stream()
                .mapToDouble(ItemCarrito::getSubtotal)
                .sum();
    }
}
