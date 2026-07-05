package com.example.sistemarestaurantebackend.config;

import com.example.sistemarestaurantebackend.models.Extra;
import com.example.sistemarestaurantebackend.models.Menu;
import com.example.sistemarestaurantebackend.models.Usuario;
import com.example.sistemarestaurantebackend.repository.ExtraRepository;
import com.example.sistemarestaurantebackend.repository.MenuRepository;
import com.example.sistemarestaurantebackend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final MenuRepository menuRepository;
    private final ExtraRepository extraRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Usuario vendedor = seedUsuario("vendedor", "Vendedor UPeU", "VENDEDOR", "vendedor123");
        seedUsuario("admin", "Administrador UPeU", "ADMIN", "admin123");
        seedUsuario("cliente", "Estudiante UPeU", "CLIENTE", "cliente123");

        if (menuRepository.count() == 0) {
            crearMenu("Menú Ejecutivo", "Arroz, lomo saltado, ensalada y refresco", 8.50, "Almuerzo", 50, vendedor);
            crearMenu("Menú del Día", "Sopa, segundo, postre y bebida", 6.00, "Almuerzo", 40, vendedor);
            crearMenu("Menú Vegetariano", "Quinua, verduras salteadas y jugo natural", 7.00, "Almuerzo", 30, vendedor);
            crearMenu("Menú Dieta", "Pollo a la plancha, puré y ensalada", 8.00, "Almuerzo", 25, vendedor);
            crearMenu("Menú Económico", "Arroz con pollo y gaseosa", 5.50, "Almuerzo", 60, vendedor);
            crearMenu("Menú Cena", "Hamburguesa, papas fritas y bebida", 9.00, "Cena", 35, vendedor);
        }

        if (extraRepository.count() == 0) {
            crearExtra("Porción extra de arroz", 1.50);
            crearExtra("Ensalada adicional", 2.00);
            crearExtra("Jugo natural grande", 2.50);
            crearExtra("Postre del día", 3.00);
        }

        asignarVendedorAMenusSinPropietario(vendedor);
    }

    private void asignarVendedorAMenusSinPropietario(Usuario vendedor) {
        menuRepository.findAll().forEach(menu -> {
            if (menu.getVendedor() == null) {
                menu.setVendedor(vendedor);
                menuRepository.save(menu);
            }
        });
    }

    private Usuario seedUsuario(String username, String nombre, String rol, String password) {
        Usuario u = usuarioRepository.findByUsername(username).orElse(new Usuario());
        u.setUsername(username);
        u.setNombreCompleto(nombre);
        u.setRol(rol);
        u.setPassword(passwordEncoder.encode(password));
        return usuarioRepository.save(u);
    }

    private void crearMenu(String nombre, String descripcion, double precio, String horario, int stock, Usuario vendedor) {
        Menu menu = new Menu();
        menu.setNombre(nombre);
        menu.setDescripcion(descripcion);
        menu.setPrecio(precio);
        menu.setHorario(horario);
        menu.setDisponibles(stock);
        menu.setPublicado(true);
        menu.setVendedor(vendedor);
        menuRepository.save(menu);
    }

    private void crearExtra(String nombre, double precio) {
        Extra extra = new Extra();
        extra.setNombre(nombre);
        extra.setPrecio(precio);
        extraRepository.save(extra);
    }
}
