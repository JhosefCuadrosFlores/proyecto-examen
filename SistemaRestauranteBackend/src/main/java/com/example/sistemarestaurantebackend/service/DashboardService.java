package com.example.sistemarestaurantebackend.service;

import com.example.sistemarestaurantebackend.dto.DashboardDTO;
import com.example.sistemarestaurantebackend.dto.MenuVendidoDTO;
import com.example.sistemarestaurantebackend.models.Menu;

import java.util.List;

public interface DashboardService {
    DashboardDTO obtenerDashboard(Long usuarioId);
    
    // Métodos para el dashboard administrativo
    DashboardDTO obtenerEstadisticasGenerales();
    List<Object> obtenerActividadReciente();
    List<MenuVendidoDTO> obtenerMenusMasVendidos();
}