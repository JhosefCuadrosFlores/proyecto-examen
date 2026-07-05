package com.example.sistemarestaurantebackend.repository;

import com.example.sistemarestaurantebackend.models.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByUsuarioId(Long usuarioId);
    
    @Query("SELECT COUNT(p) FROM Pedido p")
    long countAllPedidos();
    
    @Query("SELECT SUM(p.total) FROM Pedido p")
    Double sumAllTotals();
    
    List<Pedido> findTop10ByOrderByCreadoEnDesc();
}