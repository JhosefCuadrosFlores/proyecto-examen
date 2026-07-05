package com.example.sistemarestaurantebackend.controller;

import com.example.sistemarestaurantebackend.dto.DashboardDTO;
import com.example.sistemarestaurantebackend.dto.MenuVendidoDTO;
import com.example.sistemarestaurantebackend.models.Pedido;
import com.example.sistemarestaurantebackend.models.Reserva;
import com.example.sistemarestaurantebackend.service.DashboardService;
import com.example.sistemarestaurantebackend.utils.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/estadisticas")
    public ApiResponse<DashboardDTO> obtenerEstadisticasGenerales() {
        DashboardDTO estadisticas = dashboardService.obtenerEstadisticasGenerales();
        return ApiResponse.success(estadisticas);
    }

    @GetMapping("/actividad-reciente")
    public ApiResponse<List<Object>> obtenerActividadReciente() {
        List<Object> actividad = dashboardService.obtenerActividadReciente();
        return ApiResponse.success(actividad);
    }

    @GetMapping("/menus-mas-vendidos")
    public ApiResponse<List<MenuVendidoDTO>> obtenerMenusMasVendidos() {
        List<MenuVendidoDTO> menus = dashboardService.obtenerMenusMasVendidos();
        return ApiResponse.success(menus);
    }
}