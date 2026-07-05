package com.example.sistemarestaurantebackend.dto;

import com.example.sistemarestaurantebackend.models.Menu;
import com.example.sistemarestaurantebackend.models.Reserva;
import com.example.sistemarestaurantebackend.models.Usuario;
import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DashboardDTO {

    // Campos para el dashboard de usuario individual
    private Usuario usuario;
    private Long reservasActivas;
    private Double saldoGastado;
    private List<Reserva> proximasReservas;
    private List<Menu> menusHoy;
    
    // Campos para el dashboard administrativo
    private Long totalVentas;
    private Double ingresosTotales;
    private Double ventasHoy;
    private Long totalReservas;
    private Long reservasHoy;
    private Long recogidasHoy;
    private List<Object> actividadReciente;
    private List<MenuVendidoDTO> menusMasVendidos;
}
