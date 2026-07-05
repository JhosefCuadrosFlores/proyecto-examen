package com.example.sistemarestaurantebackend.utils;



import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean ok;
    private String mensaje;
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "OK", data);
    }

    public static <T> ApiResponse<T> error(String mensaje) {
        return new ApiResponse<>(false, mensaje, null);
    }




}
