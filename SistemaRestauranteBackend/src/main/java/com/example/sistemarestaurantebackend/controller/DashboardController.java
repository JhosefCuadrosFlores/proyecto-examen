package com.example.sistemarestaurantebackend.controller;


import com.example.sistemarestaurantebackend.dto.DashboardDTO;
import com.example.sistemarestaurantebackend.service.DashboardService;
import com.example.sistemarestaurantebackend.utils.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/{usuarioId}")
    public ApiResponse<DashboardDTO> obtenerDashboard(@PathVariable Long usuarioId) {
        DashboardDTO data = dashboardService.obtenerDashboard(usuarioId);
        return ApiResponse.success(data);
    }
}
