package com.example.sistemarestaurantebackend.repository;

import com.example.sistemarestaurantebackend.models.Extra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExtraRepository extends JpaRepository<Extra, Long> {
}