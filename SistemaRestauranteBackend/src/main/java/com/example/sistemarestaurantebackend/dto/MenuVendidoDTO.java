package com.example.sistemarestaurantebackend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@Builder
public class MenuVendidoDTO {
    private Long menuId;
    private String menuNombre;
    private Long cantidadVendida;
    private Double precioUnitario;
    private Double ingresosTotal;

    public MenuVendidoDTO(Long menuId, String menuNombre, Long cantidadVendida) {
        this(menuId, menuNombre, cantidadVendida, 0.0, 0.0);
    }

    public MenuVendidoDTO(Long menuId, String menuNombre, Long cantidadVendida, Double precioUnitario, Double ingresosTotal) {
        this.menuId = menuId;
        this.menuNombre = menuNombre;
        this.cantidadVendida = cantidadVendida;
        this.precioUnitario = precioUnitario;
        this.ingresosTotal = ingresosTotal;
    }
}