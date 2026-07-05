package com.example.sistemarestaurantebackend.service.impl;


import com.example.sistemarestaurantebackend.dto.JwtResponseDTO;
import com.example.sistemarestaurantebackend.dto.LoginRequestDTO;
import com.example.sistemarestaurantebackend.dto.RegisterRequestDTO;
import com.example.sistemarestaurantebackend.models.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.sistemarestaurantebackend.repository.UsuarioRepository;
import com.example.sistemarestaurantebackend.security.jwt.JwtUtils;
import com.example.sistemarestaurantebackend.service.AuthService;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UsuarioRepository usuarioRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Override
    public JwtResponseDTO loginUser(LoginRequestDTO loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        Usuario userDetails = (Usuario) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority())
                .collect(Collectors.toList());

        return JwtResponseDTO.builder()
                .token(jwt)
                .id(userDetails.getId())
                .username(userDetails.getUsername())
                .nombreCompleto(userDetails.getNombreCompleto())
                .roles(roles)
                .build();
    }

    @Override
    public ResponseEntity<?> registerUser(RegisterRequestDTO registerRequest) {
        if (usuarioRepository.existsByUsername(registerRequest.getUsername())) {
            return ResponseEntity.badRequest().body("Error: El nombre de usuario ya está en uso.");
        }

        Usuario user = new Usuario();
        user.setUsername(registerRequest.getUsername());
        user.setNombreCompleto(registerRequest.getNombreCompleto());
        user.setPassword(encoder.encode(registerRequest.getPassword()));

        String rol = registerRequest.getRol().toUpperCase();
        if (!rol.equals("ADMIN") && !rol.equals("VENDEDOR")) {
            return ResponseEntity.badRequest().body("Error: El rol especificado no es válido.");
        }
        user.setRol(rol);
        usuarioRepository.save(user);

        return ResponseEntity.ok("Usuario registrado exitosamente.");
    }
}