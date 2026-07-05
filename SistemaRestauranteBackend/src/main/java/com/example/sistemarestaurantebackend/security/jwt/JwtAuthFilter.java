package com.example.sistemarestaurantebackend.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import com.example.sistemarestaurantebackend.security.UserDetailsServiceImpl;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

public class JwtAuthFilter extends OncePerRequestFilter {
    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    // Endpoints that should be publicly accessible without JWT validation
    private static final List<String> PUBLIC_ENDPOINTS = Arrays.asList(
            "/api/pedidos",
            "/api/auth",
            "/api/reservas",
            "/api/vendedor-reservas",
            "/api/boletas",
            "/api/dashboard",
            "/uploads"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // Get request URI
            String requestURI = request.getRequestURI();
            String requestMethod = request.getMethod();
            logger.debug("Processing request to: {} [{}]", requestURI, requestMethod);

            // Check if the request is for a public endpoint
            boolean isPublicEndpoint = PUBLIC_ENDPOINTS.stream()
                    .anyMatch(endpoint -> requestURI.startsWith(endpoint));
            
            // Allow GET requests to /api/menus without authentication
            boolean isPublicMenuGet = requestURI.startsWith("/api/menus") && "GET".equalsIgnoreCase(requestMethod);

            // If it's a public endpoint or public menu GET, skip JWT validation if no token present
            if (isPublicEndpoint || isPublicMenuGet) {
                String jwt = parseJwt(request);
                // If there's a token, validate it (for optional authentication)
                if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                    String username = jwtUtils.getUserNameFromJwtToken(jwt);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("Successfully authenticated user: {}", username);
                }
                logger.debug("Allowing public access to: {} [{}]", requestURI, requestMethod);
                filterChain.doFilter(request, response);
                return;
            }

            // For protected endpoints, validate JWT token
            String jwt = parseJwt(request);
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUserNameFromJwtToken(jwt);

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.debug("Successfully authenticated user: {}", username);
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}