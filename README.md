# Comedor UPeU

Sistema web para gestión del comedor universitario: reservas, menús, pedidos y paneles por rol (Cliente, Vendedor, Admin).

## Stack

- **Frontend:** Angular (`frontendcomedor/`)
- **Backend:** Spring Boot 3 + JWT (`SistemaRestauranteBackend/`)
- **Base de datos:** MySQL 8 en Docker

## Requisitos

- Docker Desktop
- Java JDK 17+ (probado con 21)
- Node.js 18+

## Instalación rápida

### 1. Base de datos (Docker)

```bash
cd copia
copy .env.example .env
docker compose up -d
```

### 2. Backend

**Windows (CMD):**

```bat
cd SistemaRestauranteBackend
set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.10"
set "PATH=%JAVA_HOME%\bin;%PATH%"
java -classpath ".mvn\wrapper\maven-wrapper.jar" "-Dmaven.multiModuleProjectDirectory=%CD%" org.apache.maven.wrapper.MavenWrapperMain spring-boot:run
```

O doble clic en `SistemaRestauranteBackend/start-backend.bat`.

Backend: http://localhost:8080

### 3. Frontend

```bash
cd frontendcomedor
npm install
node node_modules/@angular/cli/bin/ng.js serve
```

App: http://localhost:4200

## Credenciales de prueba

| Rol      | Usuario   | Contraseña   |
|----------|-----------|--------------|
| Admin    | admin     | admin123     |
| Vendedor | vendedor  | vendedor123  |
| Cliente  | cliente   | cliente123   |

## Estructura del proyecto

```
├── docker-compose.yml      # MySQL en Docker
├── .env.example            # Variables de entorno (copiar a .env)
├── frontendcomedor/        # Angular - UI por rol
└── SistemaRestauranteBackend/  # API REST Spring Boot
```

## Roles

- **Cliente/Estudiante:** Ver menús, reservar (con o sin cuenta), ver reservas.
- **Vendedor:** Gestionar menús, ver pedidos, cambiar estados, boletas.
- **Admin:** Estadísticas, ventas del día, configuración, reservas globales.

## Equipo

Proyecto grupal — 4 integrantes. Usar ramas por módulo y Pull Requests hacia `main`.
