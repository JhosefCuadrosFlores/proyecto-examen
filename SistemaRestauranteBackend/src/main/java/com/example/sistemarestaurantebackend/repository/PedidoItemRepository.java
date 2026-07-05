package com.example.sistemarestaurantebackend.repository;

import com.example.sistemarestaurantebackend.dto.MenuVendidoDTO;
import com.example.sistemarestaurantebackend.models.PedidoItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoItemRepository extends JpaRepository<PedidoItem, Long> {
    
    @Query("SELECT new com.example.sistemarestaurantebackend.dto.MenuVendidoDTO(pi.menuId, pi.menuNombre, SUM(pi.cantidad)) " +
           "FROM PedidoItem pi " +
           "GROUP BY pi.menuId, pi.menuNombre " +
           "ORDER BY SUM(pi.cantidad) DESC")
    List<MenuVendidoDTO> findMostSoldMenus();
    
    @Query("SELECT new com.example.sistemarestaurantebackend.dto.MenuVendidoDTO(" +
           "pi.menuId, pi.menuNombre, SUM(pi.cantidad), MAX(pi.precioUnitario), SUM(pi.subtotal)) " +
           "FROM PedidoItem pi " +
           "GROUP BY pi.menuId, pi.menuNombre " +
           "ORDER BY SUM(pi.cantidad) DESC")
    List<MenuVendidoDTO> findTop5MostSoldMenus();
}