package com.example.sistemarestaurantebackend.service;

import com.example.sistemarestaurantebackend.models.Menu;
import com.example.sistemarestaurantebackend.repository.MenuRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuService {
    private final MenuRepository menuRepository;

    public List<Menu> listarTodos() {
        return menuRepository.findAll();
    }

    public Menu obtenerPorId(Long id) {
        return menuRepository.findById(id).orElse(null);
    }

    public List<Menu> listarPorHorario(String horario) {
        return menuRepository.findByHorario(horario);
    }

    public Menu guardar(Menu m) { 
        return menuRepository.save(m); 
    }

    public void eliminar(Long id) { 
        menuRepository.deleteById(id); 
    }

    public List<Menu> listarPorVendedor(Long vendedorId) {
        return menuRepository.findByVendedorId(vendedorId);
    }

    public List<Menu> listarPublicados() {
        return menuRepository.findPublicadosParaCliente();
    }

    public List<Menu> listarPorHorarioPublicados(String horario) {
        return menuRepository.findPublicadosParaCliente().stream()
                .filter(m -> horario.equalsIgnoreCase(m.getHorario()))
                .toList();
    }
}
