import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MockDashboardService {
  private apiUrl = 'http://localhost:8080/api/dashboard';

  constructor() {}

  getEstadisticas(): Observable<any> {
    console.log('MockDashboardService - getEstadisticas - usando datos mock');
    return of({
      ventasHoy: 1245.00,
      reservasHoy: 142,
      recogidasHoy: 89,
      becadosTotal: 87,
      becadosActivos: 23
    });
  }

  getActividadReciente(): Observable<any[]> {
    console.log('MockDashboardService - getActividadReciente - usando datos mock');
    return of([
      { 
        avatar: 'AG', 
        nombre: 'Ana García', 
        descripcion: 'Menú Ejecutivo • Venta', 
        monto: 8.00, 
        tipo: 'Venta',
        hora: '11:30 AM' 
      },
      { 
        avatar: 'CR', 
        nombre: 'Carlos Ruiz', 
        descripcion: 'Menú Dieta • Beca', 
        monto: 0, 
        tipo: 'Beca',
        hora: '11:25 AM' 
      },
      { 
        avatar: 'ML', 
        nombre: 'María López', 
        descripcion: 'Menú Vegetariano • Venta', 
        monto: 7.00, 
        tipo: 'Venta',
        hora: '11:20 AM' 
      },
      { 
        avatar: 'PS', 
        nombre: 'Pedro Sánchez', 
        descripcion: 'Menú del Día • Reserva', 
        monto: 6.00, 
        tipo: 'Reserva',
        hora: '11:15 AM' 
      }
    ]);
  }

  getMenusMasVendidos(): Observable<any[]> {
    console.log('MockDashboardService - getMenusMasVendidos - usando datos mock');
    return of([
      { posicion: 1, nombre: 'Menú Ejecutivo', vendidos: 342, total: 2736 },
      { posicion: 2, nombre: 'Menú del Día', vendidos: 298, total: 1788 },
      { posicion: 3, nombre: 'Menú Vegetariano', vendidos: 187, total: 1309 },
      { posicion: 4, nombre: 'Menú Dieta', vendidos: 156, total: 1248 },
      { posicion: 5, nombre: 'Menú Económico', vendidos: 134, total: 670 }
    ]);
  }
}