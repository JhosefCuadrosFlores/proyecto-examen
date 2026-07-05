package com.example.sistemarestaurantebackend.service;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

    public FileStorageService() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("No se pudo crear el directorio donde se almacenarán los archivos.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        // Normalizar el nombre del archivo
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename().replace(" ", "_");

        try {
            // Verificar si el archivo está vacío
            if (file.isEmpty()) {
                throw new RuntimeException("No se puede almacenar un archivo vacío.");
            }

            // Copiar el archivo al directorio de destino
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation);

            // Devolver la URL relativa para acceder al archivo
            return "/uploads/" + fileName;
        } catch (IOException ex) {
            throw new RuntimeException("No se pudo almacenar el archivo " + fileName + ". Inténtalo de nuevo.", ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new RuntimeException("Archivo no encontrado " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new RuntimeException("Archivo no encontrado " + fileName, ex);
        }
    }
}
