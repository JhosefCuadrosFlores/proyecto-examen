package com.example.sistemarestaurantebackend.repository;

import com.example.sistemarestaurantebackend.models.EstadoReserva;
import com.example.sistemarestaurantebackend.models.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    List<Reserva> findByUsuarioId(Long id);
    long countByUsuarioIdAndEstado(Long id, EstadoReserva estado);
    List<Reserva> findByUsuarioIdOrderByFechaReservaDesc(Long usuarioId);

    @Query("SELECT r FROM Reserva r JOIN r.menu m WHERE m.vendedor.id = :vendedorId ORDER BY r.fechaReserva DESC")
    List<Reserva> findByMenuVendedorIdOrderByFechaReservaDesc(@Param("vendedorId") Long vendedorId);

    @Query("SELECT r FROM Reserva r WHERE r.menu.id IN :menuIds ORDER BY r.fechaReserva DESC")
    List<Reserva> findByMenuIdInOrderByFechaReservaDesc(@Param("menuIds") List<Long> menuIds);
    
    @Query("SELECT COUNT(r) FROM Reserva r")
    long countAllReservas();

    @Query("SELECT COALESCE(SUM(r.total), 0) FROM Reserva r WHERE CAST(r.fechaReserva AS date) = CURRENT_DATE")
    Double sumTotalHoy();

    @Query("SELECT COUNT(r) FROM Reserva r WHERE CAST(r.fechaReserva AS date) = CURRENT_DATE")
    long countReservasHoy();

    @Query("SELECT COUNT(r) FROM Reserva r WHERE CAST(r.fechaReserva AS date) = CURRENT_DATE AND r.estado = com.example.sistemarestaurantebackend.models.EstadoReserva.RECOGIDO")
    long countRecogidasHoy();
    
    List<Reserva> findTop10ByOrderByFechaReservaDesc();
}
