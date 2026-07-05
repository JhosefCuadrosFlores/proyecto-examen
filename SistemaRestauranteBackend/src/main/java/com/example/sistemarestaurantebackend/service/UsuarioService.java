package com.example.sistemarestaurantebackend.service;


import com.example.sistemarestaurantebackend.models.Usuario;

public interface UsuarioService {
    Usuario buscarPorId(Long id);
}