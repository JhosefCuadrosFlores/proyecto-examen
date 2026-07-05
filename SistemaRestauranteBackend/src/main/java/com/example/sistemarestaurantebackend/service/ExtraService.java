package com.example.sistemarestaurantebackend.service;

import com.example.sistemarestaurantebackend.models.Extra;
import com.example.sistemarestaurantebackend.repository.ExtraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExtraService {
    private final ExtraRepository extraRepository;

    public List<Extra> listarTodos() { return extraRepository.findAll(); }
}