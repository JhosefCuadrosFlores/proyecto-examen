package com.example.sistemarestaurantebackend.service.impl;

import com.example.sistemarestaurantebackend.models.Usuario;
import com.example.sistemarestaurantebackend.repository.UsuarioRepository;
import com.example.sistemarestaurantebackend.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id " + id));
    }
}