package com.example.sistemarestaurantebackend.service;

import com.example.sistemarestaurantebackend.dto.ConfirmarReservaDTO;
import com.example.sistemarestaurantebackend.dto.PedidoResponseDTO;
import com.example.sistemarestaurantebackend.models.*;
import com.example.sistemarestaurantebackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final MenuRepository menuRepository;
    private final ExtraRepository extraRepository;
    private final PedidoRepository pedidoRepository;
    private final PedidoItemRepository pedidoItemRepository;
    private final UsuarioRepository usuarioRepository;
    private final ReservaRepository reservaRepository;
    private final BoletaRepository boletaRepository;
    private final ConsumoMensualService consumoMensualService;

    @Transactional
    public PedidoResponseDTO confirmarReserva(ConfirmarReservaDTO dto) {
        // Validar que el menuId no sea null
        if (dto.getMenuId() == null) {
            throw new RuntimeException("El ID del menú es requerido. Por favor seleccione un menú antes de confirmar el pedido.");
        }

        // Validar que el método de pago no sea null
        if (dto.getMetodoPago() == null || dto.getMetodoPago().trim().isEmpty()) {
            throw new RuntimeException("El método de pago es requerido. Por favor seleccione un método de pago.");
        }

        // Validar que el número de operación esté presente para Yape y Plin
        if (("Yape".equalsIgnoreCase(dto.getMetodoPago()) || "Plin".equalsIgnoreCase(dto.getMetodoPago()))
                && (dto.getNumeroOperacion() == null || dto.getNumeroOperacion().trim().isEmpty())) {
            throw new RuntimeException("El número de operación es requerido para pagos con " + dto.getMetodoPago() + ".");
        }

        if (dto.getNombreCliente() == null || dto.getNombreCliente().isBlank()) {
            throw new RuntimeException("El nombre del cliente es obligatorio para reservar.");
        }

        Menu menu = menuRepository.findById(dto.getMenuId())
                .orElseThrow(() -> new RuntimeException("Menú no encontrado con ID: " + dto.getMenuId()));

        if (menu.getVendedor() == null) {
            usuarioRepository.findByUsername("vendedor").ifPresent(menu::setVendedor);
            menuRepository.save(menu);
        }

        int cantidad = (dto.getCantidad() == null || dto.getCantidad() < 1) ? 1 : dto.getCantidad();

        if (menu.getDisponibles() == null) menu.setDisponibles(0);
        if (menu.getDisponibles() < cantidad) {
            throw new RuntimeException("Stock insuficiente. Solo quedan " + menu.getDisponibles() + " unidades disponibles.");
        }

        // calcular subtotal: menu.price * cantidad + extras sumados
        double subtotal = menu.getPrecio() * cantidad;
        double extrasTotal = 0.0;
        List<Extra> extras = new ArrayList<>();
        if (dto.getExtrasIds() != null && !dto.getExtrasIds().isEmpty()) {
            extras = extraRepository.findAllById(dto.getExtrasIds());
            for (Extra e : extras) {
                extrasTotal += e.getPrecio();
            }
        }

        // Calcular total: subtotal + extras
        double total = subtotal + extrasTotal;

        // validar método de pago
        String metodo = dto.getMetodoPago();
        if (!("Yape".equalsIgnoreCase(metodo) || "Plin".equalsIgnoreCase(metodo) || "Tarjeta".equalsIgnoreCase(metodo) || "Efectivo".equalsIgnoreCase(metodo))) {
            throw new RuntimeException("Método de pago inválido: " + metodo + ". Los métodos válidos son: Yape, Plin, Tarjeta, Efectivo.");
        }

        // crear pedido
        Pedido pedido = new Pedido();
        pedido.setSubtotal(subtotal);
        pedido.setTotal(total);
        pedido.setMetodoPago(dto.getMetodoPago());
        pedido.setNumeroOperacion(dto.getNumeroOperacion());
        pedido.setComentarios(dto.getComentarios());

        if (dto.getUsuarioId() != null) {
            usuarioRepository.findById(dto.getUsuarioId()).ifPresent(pedido::setUsuario);
        }

        pedido = pedidoRepository.save(pedido);

        // crear item del menu
        PedidoItem item = new PedidoItem();
        item.setPedido(pedido);
        item.setMenuId(menu.getId());
        item.setMenuNombre(menu.getNombre());
        item.setPrecioUnitario(menu.getPrecio());
        item.setCantidad(cantidad);
        item.setSubtotal(menu.getPrecio() * cantidad + extras.stream().mapToDouble(Extra::getPrecio).sum());

        pedidoItemRepository.save(item);

        // (Opcional) -- si quieres guardar cada extra como item separado, lo puedes hacer; aquí solo sumamos su precio.

        // reducir stock
        menu.setDisponibles(menu.getDisponibles() - cantidad);
        menuRepository.save(menu);

        // crear registro de reserva para dashboard del cliente
        com.example.sistemarestaurantebackend.models.Reserva reserva = new com.example.sistemarestaurantebackend.models.Reserva();
        reserva.setUsuario(pedido.getUsuario());
        reserva.setMenu(menu);
        reserva.setFechaReserva(LocalDateTime.now()); // Cambiado a LocalDateTime.now()
        reserva.setEstado(com.example.sistemarestaurantebackend.models.EstadoReserva.PENDIENTE);
        reserva.setCantidad(cantidad);
        reserva.setTotal(total);
        if (dto.getNombreCliente() != null && !dto.getNombreCliente().isBlank()) {
            reserva.setNombreCliente(dto.getNombreCliente().trim());
        } else if (pedido.getUsuario() != null) {
            reserva.setNombreCliente(pedido.getUsuario().getNombreCompleto());
        } else {
            reserva.setNombreCliente("Invitado");
        }
        reserva.setMetodoPago(dto.getMetodoPago());
        reserva.setNumeroOperacion(dto.getNumeroOperacion());
        reserva = reservaRepository.save(reserva);

        Boleta boleta = crearBoletaDesdeReserva(dto, menu, pedido, reserva, total, cantidad, extras);

        if (pedido.getUsuario() != null) {
            consumoMensualService.registrarConsumo(pedido.getUsuario(), total);
        }

        // construir respuesta
        PedidoResponseDTO resp = new PedidoResponseDTO();
        resp.setId(pedido.getId());
        resp.setCreadoEn(pedido.getCreadoEn());
        resp.setSubtotal(pedido.getSubtotal());
        resp.setTotal(pedido.getTotal());
        resp.setMetodoPago(pedido.getMetodoPago());
        resp.setItems(List.of(item));
        resp.setComentarios(pedido.getComentarios());
        resp.setReservaId(reserva.getId());
        resp.setBoletaNumero(boleta.getNumero());

        return resp;
    }

    private Boleta crearBoletaDesdeReserva(
            ConfirmarReservaDTO dto,
            Menu menu,
            Pedido pedido,
            Reserva reserva,
            double total,
            int cantidad,
            List<Extra> extras
    ) {
        Boleta boleta = new Boleta();
        boleta.setNumero("BOL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        if (pedido.getUsuario() != null) {
            boleta.setEstudianteCodigo(pedido.getUsuario().getUsername());
        } else {
            boleta.setEstudianteCodigo("GUEST");
        }
        boleta.setEstudianteNombre(reserva.getNombreCliente());
        boleta.setMenu(menu);
        boleta.setMetodoPago(dto.getMetodoPago());
        boleta.setPagadorNombre(reserva.getNombreCliente());
        boleta.setPagadorCuenta(dto.getNumeroOperacion());
        boleta.setMonto(total);
        boleta.setReservaId(reserva.getId());
        boleta.setPedidoId(pedido.getId());
        if (menu.getVendedor() != null) {
            boleta.setVendedor(menu.getVendedor());
        }
        return boletaRepository.save(boleta);
    }

    public List<Pedido> listarPorUsuario(Long usuarioId) {
        return pedidoRepository.findByUsuarioId(usuarioId);
    }
}