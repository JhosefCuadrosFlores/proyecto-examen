package com.example.sistemarestaurantebackend.security;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.example.sistemarestaurantebackend.security.jwt.JwtAuthEntryPoint;
import com.example.sistemarestaurantebackend.security.jwt.JwtAuthFilter;

@Configuration
@EnableMethodSecurity
public class WebSecurityConfig {
    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtAuthEntryPoint unauthorizedHandler;

    @Bean
    public JwtAuthFilter authenticationJwtTokenFilter() {
        return new JwtAuthFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/dashboard/**").permitAll()
                        .requestMatchers("/api/pedidos/**").permitAll()
                        .requestMatchers("/api/reservas/**").permitAll()
                        .requestMatchers("/api/vendedor-reservas/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/boletas/vendedor/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/menus/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/menus/**").hasRole("VENDEDOR")
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/menus/**").hasAnyRole("VENDEDOR","ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/menus/**").hasAnyRole("VENDEDOR","ADMIN")
                        .requestMatchers("/api/boletas/**").hasAnyRole("VENDEDOR","ADMIN")
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}