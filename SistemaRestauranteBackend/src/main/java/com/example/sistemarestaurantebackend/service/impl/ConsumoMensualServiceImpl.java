package com.example.sistemarestaurantebackend.service.impl;

import com.example.sistemarestaurantebackend.models.ConsumoMensual;
import com.example.sistemarestaurantebackend.models.Usuario;
import com.example.sistemarestaurantebackend.repository.ConsumoMensualRepository;
import com.example.sistemarestaurantebackend.service.ConsumoMensualService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class ConsumoMensualServiceImpl implements ConsumoMensualService {

    private final ConsumoMensualRepository consumoRepo;

    @Override
    public double obtenerTotalGastadoDelMes(Long usuarioId) {
        int mes = LocalDate.now().getMonthValue();
        int año = LocalDate.now().getYear();

        ConsumoMensual consumo = consumoRepo.findByUsuarioIdAndMesAndAño(usuarioId, mes, año);

        return consumo != null ? consumo.getTotalGastado() : 0.0;
    }

    @Override
    public void registrarConsumo(Usuario usuario, double monto) {
        if (usuario == null) return;

        int mes = LocalDate.now().getMonthValue();
        int año = LocalDate.now().getYear();

        ConsumoMensual consumo = consumoRepo.findByUsuarioIdAndMesAndAño(usuario.getId(), mes, año);
        if (consumo == null) {
            consumo = ConsumoMensual.builder()
                    .usuario(usuario)
                    .mes(mes)
                    .año(año)
                    .totalGastado(monto)
                    .build();
        } else {
            consumo.setTotalGastado(consumo.getTotalGastado() + monto);
        }
        consumoRepo.save(consumo);
    }
}
