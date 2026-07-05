package com.example.sistemarestaurantebackend.repository;

import com.example.sistemarestaurantebackend.models.Menu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MenuRepository extends JpaRepository<Menu, Long> {
    List<Menu> findByHorario(String horario);
    List<Menu> findByVendedorId(Long vendedorId);

    @Query("SELECT m FROM Menu m WHERE m.publicado IS NULL OR m.publicado = true")
    List<Menu> findPublicadosParaCliente();
    List<Menu> findByHorarioAndPublicadoTrue(String horario);
}
