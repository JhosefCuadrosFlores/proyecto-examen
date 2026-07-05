package com.example.sistemarestaurantebackend.controller;

import com.example.sistemarestaurantebackend.models.Menu;
import com.example.sistemarestaurantebackend.service.FileStorageService;
import com.example.sistemarestaurantebackend.service.MenuService;
import com.example.sistemarestaurantebackend.utils.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/menus")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;
    private final FileStorageService fileStorageService;

    @GetMapping
    public List<Menu> listarMenus() { return menuService.listarTodos(); }

    @GetMapping("/publicados")
    public List<Menu> listarMenusPublicados() { return menuService.listarPublicados(); }

    @GetMapping("/{id}")
    public Menu obtenerMenu(@PathVariable Long id) { return menuService.obtenerPorId(id); }

    @GetMapping("/horario/{horario}")
    public List<Menu> porHorario(@PathVariable String horario) { return menuService.listarPorHorario(horario); }

    @PostMapping
    @PreAuthorize("hasRole('VENDEDOR')")
    public Menu crearMenu(@RequestBody Menu menu) {
        System.out.println("=== CREAR MENU ===");
        System.out.println("Menu recibido: " + menu);
        System.out.println("Disponibles recibido: " + menu.getDisponibles());
        
        Object principal = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof com.example.sistemarestaurantebackend.models.Usuario usuario) {
            menu.setVendedor(usuario);
        }
        
        // FORZAR stock inicial de 50 unidades si es null o 0
        if (menu.getDisponibles() == null || menu.getDisponibles() <= 0) {
            System.out.println("Disponibles es NULL o 0, inicializando a 50");
            menu.setDisponibles(50);
        }

        if (menu.getFechaMenu() == null) {
            menu.setFechaMenu(java.time.LocalDate.now());
        }
        if (menu.getHoraInicio() == null || menu.getHoraInicio().isBlank()) {
            menu.setHoraInicio("11:00");
        }
        if (menu.getHoraFin() == null || menu.getHoraFin().isBlank()) {
            menu.setHoraFin("14:00");
        }
        if (menu.getHorario() == null || menu.getHorario().isBlank()) {
            menu.setHorario("Almuerzo");
        }
        if (menu.getPublicado() == null) {
            menu.setPublicado(true);
        }
        System.out.println("Disponibles antes de guardar: " + menu.getDisponibles());
        
        Menu guardado = menuService.guardar(menu);
        
        System.out.println("Menu guardado: " + guardado);
        System.out.println("Disponibles después de guardar: " + guardado.getDisponibles());
        
        return guardado;
    }

    @PostMapping("/{id}/imagen")
    public ResponseEntity<Map<String, String>> subirImagenMenu(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        // Guardar el archivo
        String fileName = fileStorageService.storeFile(file);
        
        // Actualizar el menú con la URL de la imagen
        Menu menu = menuService.obtenerPorId(id);
        if (menu == null) {
            throw new RuntimeException("Menú no encontrado");
        }
        menu.setImagenUrl(fileName);
        menuService.guardar(menu);
        
        return ResponseEntity.ok(Map.of("imagenUrl", fileName));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('VENDEDOR', 'ADMIN')")
    public Menu actualizarMenu(@PathVariable Long id, @RequestBody Menu menu) {
        System.out.println("=== ACTUALIZAR MENU ===");
        System.out.println("Menu ID: " + id);
        System.out.println("Menu recibido: " + menu);
        System.out.println("Disponibles recibido: " + menu.getDisponibles());
        
        Menu existente = menuService.obtenerPorId(id);
        if (existente == null) throw new RuntimeException("Menú no encontrado");
        
        System.out.println("Menu existente: " + existente);
        System.out.println("Disponibles existente: " + existente.getDisponibles());
        
        existente.setNombre(menu.getNombre());
        existente.setDescripcion(menu.getDescripcion());
        existente.setPrecio(menu.getPrecio());
        existente.setHorario(menu.getHorario());
        existente.setFechaMenu(menu.getFechaMenu());
        existente.setHoraInicio(menu.getHoraInicio());
        existente.setHoraFin(menu.getHoraFin());
        existente.setImagenUrl(menu.getImagenUrl());
        if (menu.getDisponibles() != null) {
            existente.setDisponibles(menu.getDisponibles());
        }
        if (menu.getPublicado() != null) {
            existente.setPublicado(menu.getPublicado());
        } else if (existente.getPublicado() == null) {
            existente.setPublicado(true);
        }
        
        System.out.println("Menu antes de guardar: " + existente);
        System.out.println("Disponibles antes de guardar: " + existente.getDisponibles());
        
        Menu guardado = menuService.guardar(existente);
        
        System.out.println("Menu guardado: " + guardado);
        System.out.println("Disponibles después de guardar: " + guardado.getDisponibles());
        
        return guardado;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('VENDEDOR', 'ADMIN')")
    public void eliminarMenu(@PathVariable Long id) {
        menuService.eliminar(id);
    }

    @GetMapping("/vendedor/{vendedorId}")
    public List<Menu> listarPorVendedor(@PathVariable Long vendedorId) {
        return menuService.listarPorVendedor(vendedorId);
    }
    
    // Endpoint temporal para resetear stock de todos los menús
    @PostMapping("/resetear-stock")
    public ResponseEntity<String> resetearStock() {
        List<Menu> menus = menuService.listarTodos();
        int count = 0;
        for (Menu menu : menus) {
            menu.setDisponibles(20); // Poner 20 unidades a cada menú
            menuService.guardar(menu);
            count++;
        }
        return ResponseEntity.ok("Stock reseteado en " + count + " menús. Todos tienen ahora 20 unidades.");
    }
    
    // Endpoint para verificar el stock actual
    @GetMapping("/verificar-stock")
    public ResponseEntity<?> verificarStock() {
        List<Menu> menus = menuService.listarTodos();
        List<Map<String, Object>> resultado = new java.util.ArrayList<>();
        for (Menu menu : menus) {
            Map<String, Object> info = new java.util.HashMap<>();
            info.put("id", menu.getId());
            info.put("nombre", menu.getNombre());
            info.put("disponibles", menu.getDisponibles());
            info.put("precio", menu.getPrecio());
            info.put("publicado", menu.getPublicado());
            resultado.add(info);
        }
        return ResponseEntity.ok(resultado);
    }
}