import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['../../styles.css', './login.css'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class LoginComponent implements OnInit {

  username: string = '';
  password: string = '';
  role: 'VENDEDOR' | 'ADMIN' = 'VENDEDOR';
  errorMessage: string = '';
  serverOnline = false;
  serverChecking = true;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.actualizarUsuarioSugerido();
    this.verificarServidor();
  }

  verificarServidor(): void {
    this.serverChecking = true;
    this.authService.checkServerHealth().subscribe({
      next: (online) => {
        this.serverOnline = online;
        this.serverChecking = false;
        if (!online) {
          this.errorMessage = 'El backend no está disponible. Ejecuta start-backend.bat antes de iniciar sesión.';
        }
      },
      error: () => {
        this.serverOnline = false;
        this.serverChecking = false;
        this.errorMessage = 'El backend no está disponible. Ejecuta start-backend.bat antes de iniciar sesión.';
      }
    });
  }

  login() {
    this.errorMessage = '';

    if (!this.serverOnline) {
      this.errorMessage = 'El backend no está disponible. Ejecuta start-backend.bat antes de iniciar sesión.';
      return;
    }

    this.authService.login(this.username.trim(), this.password).subscribe({
      next: () => {
        const user = this.authService.getCurrentUser();

        if (!user?.rol) {
          this.router.navigate(['/dashboard']);
          return;
        }

        if (user.rol !== this.role) {
          this.authService.logout();
          this.errorMessage = `El usuario "${this.username}" es ${user.rol.toLowerCase()}, no ${this.role.toLowerCase()}. Cambia de pestaña e intenta de nuevo.`;
          return;
        }

        if (user.rol === 'VENDEDOR') {
          this.router.navigate(['/vendedor']);
        } else if (user.rol === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        if (error.status === 401) {
          this.errorMessage = 'Credenciales incorrectas. Usuario: vendedor/vendedor123 o admin/admin123';
        } else if (error.status === 0) {
          this.serverOnline = false;
          this.errorMessage = 'No se puede conectar con el servidor. Ejecuta start-backend.bat e intenta de nuevo.';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Inténtalo nuevamente.';
        }
      }
    });
  }

  setRole(role: 'VENDEDOR' | 'ADMIN') {
    this.role = role;
    this.errorMessage = '';
    this.actualizarUsuarioSugerido();
  }

  private actualizarUsuarioSugerido(): void {
    const sugerido = this.role === 'VENDEDOR' ? 'vendedor' : 'admin';
    if (!this.username || this.username === 'vendedor' || this.username === 'admin') {
      this.username = sugerido;
    }
  }
}
