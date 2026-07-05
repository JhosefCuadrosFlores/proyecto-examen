package com.example.sistemarestaurantebackend.service.impl;

import com.example.sistemarestaurantebackend.dto.DashboardDTO;
import com.example.sistemarestaurantebackend.dto.MenuVendidoDTO;
import com.example.sistemarestaurantebackend.models.Menu;
import com.example.sistemarestaurantebackend.models.Pedido;
import com.example.sistemarestaurantebackend.models.Reserva;
import com.example.sistemarestaurantebackend.models.Usuario;
import com.example.sistemarestaurantebackend.repository.PedidoItemRepository;
import com.example.sistemarestaurantebackend.repository.PedidoRepository;
import com.example.sistemarestaurantebackend.repository.ReservaRepository;
import com.example.sistemarestaurantebackend.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final UsuarioService usuarioService;
    private final MenuService menuService;
    private final ReservaService reservaService;
    private final ConsumoMensualService consumoService;
    private final PedidoRepository pedidoRepository;
    private final ReservaRepository reservaRepository;
    private final PedidoItemRepository pedidoItemRepository;

    @Override
    public DashboardDTO obtenerDashboard(Long usuarioId) {

        Usuario usuario = usuarioService.buscarPorId(usuarioId);

        return DashboardDTO.builder()
                .usuario(usuario)
                .reservasActivas(reservaService.contarReservasPendientes(usuarioId))
                .saldoGastado(consumoService.obtenerTotalGastadoDelMes(usuarioId))
                .proximasReservas(reservaService.listarProximasReservas(usuarioId))
                .menusHoy(menuService.listarPorHorarioPublicados("Almuerzo"))
                .build();
    }
    
    @Override
    public DashboardDTO obtenerEstadisticasGenerales() {
        long totalVentas = pedidoRepository.countAllPedidos();
        Double ingresosTotales = pedidoRepository.sumAllTotals();
        long totalReservas = reservaRepository.countAllReservas();
        Double ventasHoy = reservaRepository.sumTotalHoy();
        long reservasHoy = reservaRepository.countReservasHoy();
        long recogidasHoy = reservaRepository.countRecogidasHoy();
        
        // Get recent activity (last 5 pedidos and reservas)
        List<Object> actividadReciente = obtenerActividadReciente();
        
        // Get most sold menus
        List<MenuVendidoDTO> menusMasVendidos = obtenerMenusMasVendidos();
        
        return DashboardDTO.builder()
                .totalVentas(totalVentas)
                .ingresosTotales(ingresosTotales != null ? ingresosTotales : 0.0)
                .ventasHoy(ventasHoy != null ? ventasHoy : 0.0)
                .totalReservas(totalReservas)
                .reservasHoy(reservasHoy)
                .recogidasHoy(recogidasHoy)
                .actividadReciente(actividadReciente)
                .menusMasVendidos(menusMasVendidos)
                .build();
    }
    
    @Override
    public List<Object> obtenerActividadReciente() {
        List<Object> actividad = new ArrayList<>();

        actividad.addAll(pedidoRepository.findTop10ByOrderByCreadoEnDesc());
        actividad.addAll(reservaRepository.findTop10ByOrderByFechaReservaDesc());

        actividad.sort(Comparator.comparing(this::fechaActividad, Comparator.nullsLast(Comparator.reverseOrder())));

        return actividad.subList(0, Math.min(actividad.size(), 10));
    }

    private LocalDateTime fechaActividad(Object item) {
        if (item instanceof Pedido pedido) {
            return pedido.getCreadoEn();
        }
        if (item instanceof Reserva reserva) {
            return reserva.getFechaReserva();
        }
        return null;
    }
    
    @Override
    public List<MenuVendidoDTO> obtenerMenusMasVendidos() {
        return pedidoItemRepository.findTop5MostSoldMenus().stream().limit(5).toList();
    }
}
