package com.example.sistemarestaurantebackend.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Data
@Entity
@Table(name = "usuarios")
@NoArgsConstructor
public class Usuario implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false)
    private String nombreCompleto;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, unique = true)
    private String username;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false)
    private String password;

    @NotBlank
    @Column(nullable = false)
    private String rol; // "VENDEDOR" o "ADMIN"

    // --- Métodos de UserDetails ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // El rol debe tener el prefijo "ROLE_" para Spring Security
        return List.of(new SimpleGrantedAuthority("ROLE_" + this.rol));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}