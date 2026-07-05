import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface MenuItem {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  horario: string;
  stock: number;
  disponibles: number;
  disponibleDesde: string;
  disponibleHasta: string;
  imagenUrl?: string;
  publicado: boolean;
}

@Injectable({ providedIn: 'root' })
export class MockMenuService {
  private readonly menusMock: MenuItem[] = [
    {
      id: 1,
      nombre: 'Menú Ejecutivo',
      descripcion: 'Arroz, lomo saltado, ensalada y refresco',
      precio: 8.50,
      categoria: 'Almuerzo',
      horario: 'Almuerzo',
      stock: 50,
      disponibles: 50,
      disponibleDesde: '11:00',
      disponibleHasta: '14:00',
      publicado: true
    },
    {
      id: 2,
      nombre: 'Menú del Día',
      descripcion: 'Sopa, segundo, postre y bebida',
      precio: 6.00,
      categoria: 'Almuerzo',
      horario: 'Almuerzo',
      stock: 40,
      disponibles: 40,
      disponibleDesde: '11:00',
      disponibleHasta: '14:00',
      publicado: true
    },
    {
      id: 3,
      nombre: 'Menú Vegetariano',
      descripcion: 'Quinua, verduras salteadas y jugo natural',
      precio: 7.00,
      categoria: 'Almuerzo',
      horario: 'Almuerzo',
      stock: 30,
      disponibles: 30,
      disponibleDesde: '11:00',
      disponibleHasta: '14:00',
      publicado: true
    },
    {
      id: 4,
      nombre: 'Menú Dieta',
      descripcion: 'Pollo a la plancha, puré y ensalada',
      precio: 8.00,
      categoria: 'Almuerzo',
      horario: 'Almuerzo',
      stock: 25,
      disponibles: 25,
      disponibleDesde: '11:00',
      disponibleHasta: '14:00',
      publicado: true
    },
    {
      id: 5,
      nombre: 'Menú Económico',
      descripcion: 'Arroz con pollo y gaseosa',
      precio: 5.50,
      categoria: 'Almuerzo',
      horario: 'Almuerzo',
      stock: 60,
      disponibles: 60,
      disponibleDesde: '11:00',
      disponibleHasta: '14:00',
      publicado: true
    }
  ];

  listarPublicados(): Observable<MenuItem[]> {
    return of(this.menusMock);
  }

  normalizarMenu(menu: any): MenuItem {
    const horario = menu.horario || menu.categoria || 'Almuerzo';
    const horarios = this.obtenerHorarioPorTipo(horario);

    return {
      id: menu.id,
      nombre: menu.nombre,
      descripcion: menu.descripcion || '',
      precio: menu.precio ?? 0,
      categoria: horario,
      horario,
      stock: menu.stock ?? menu.disponibles ?? 0,
      disponibles: menu.disponibles ?? menu.stock ?? 0,
      disponibleDesde: menu.disponibleDesde || horarios.desde,
      disponibleHasta: menu.disponibleHasta || horarios.hasta,
      imagenUrl: menu.imagenUrl,
      publicado: menu.publicado ?? true
    };
  }

  private obtenerHorarioPorTipo(horario: string): { desde: string; hasta: string } {
    if (horario.toLowerCase().includes('cena')) {
      return { desde: '18:00', hasta: '21:00' };
    }
    return { desde: '11:00', hasta: '14:00' };
  }
}
