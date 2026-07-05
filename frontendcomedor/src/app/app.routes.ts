import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { DashboardComponent } from './dashboard/dashboard';
import { VendedorDashboardComponent } from './vendedor-dashboard/vendedor-dashboard';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { AuthGuard } from './services/login/auth-guard';

export const routes: Routes = [
  { path: '', component: DashboardComponent },

  // Login
  { path: 'login', component: LoginComponent },

  // Dashboard Cliente
  { path: 'dashboard', component: DashboardComponent },

  // Dashboard Vendedor
  { path: 'vendedor', component: VendedorDashboardComponent, canActivate: [AuthGuard], data: { role: 'VENDEDOR' } },

  // Dashboard Admin
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },

  { path: '**', redirectTo: '' }
];