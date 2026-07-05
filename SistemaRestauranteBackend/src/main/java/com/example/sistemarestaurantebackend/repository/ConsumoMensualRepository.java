package com.example.sistemarestaurantebackend.repository;

import com.example.sistemarestaurantebackend.models.ConsumoMensual;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsumoMensualRepository extends JpaRepository<ConsumoMensual, Long> {
    ConsumoMensual findByUsuarioIdAndMesAndAño(Long usuarioId, int mes, int año);
}