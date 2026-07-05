import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = 'http://localhost:8080/api/dashboard/admin';

  constructor(private http: HttpClient) {}

  private unwrap<T>(response: any): T {
    return response?.data ?? response;
  }

  getEstadisticas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas`).pipe(
      map((response) => {
        const data = this.unwrap<any>(response);
        return {
          ventasHoy: data?.ventasHoy ?? null,
          ingresosTotales: data?.ingresosTotales ?? 0,
          reservasHoy: data?.reservasHoy ?? null,
          recogidasHoy: data?.recogidasHoy ?? null,
          becadosTotal: data?.becadosTotal ?? 0,
          becadosActivos: data?.becadosActivos ?? 0
        };
      })
    );
  }

  getActividadReciente(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/actividad-reciente`).pipe(
      map((response) => {
        const items = this.unwrap<any[]>(response) ?? [];
        return items.map((item: any) => this.mapActividad(item));
      })
    );
  }

  getMenusMasVendidos(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/menus-mas-vendidos`).pipe(
      map((response) => {
        const items = this.unwrap<any[]>(response) ?? [];
        return items.map((menu: any, index: number) => ({
          posicion: index + 1,
          nombre: menu.menuNombre ?? menu.nombre ?? 'Menú desconocido',
          vendidos: Number(menu.cantidadVendida ?? menu.vendidos ?? 0),
          precio: Number(menu.precioUnitario ?? menu.precio ?? 0),
          total: Number(menu.ingresosTotal ?? menu.total ?? 0)
        }));
      })
    );
  }

  private mapActividad(item: any): any {
    const nombre = item?.nombreCliente
      ?? item?.usuario?.nombreCompleto
      ?? item?.usuario?.username
      ?? item?.nombre
      ?? 'Cliente';
    const iniciales = String(nombre).slice(0, 2).toUpperCase();
    const menuNombre = item?.menu?.nombre
      ?? item?.items?.[0]?.menuNombre
      ?? item?.items?.[0]?.menu?.nombre
      ?? 'Menú';
    const esReserva = item?.fechaReserva != null && item?.estado != null;
    const horaFuente = item?.fechaReserva ?? item?.creadoEn ?? item?.hora ?? '';

    return {
      avatar: item?.avatar ?? iniciales,
      nombre,
      descripcion: item?.descripcion ?? `${menuNombre} • ${esReserva ? 'Reserva' : 'Venta'}`,
      monto: item?.total ?? item?.monto ?? 0,
      tipo: item?.tipo ?? (esReserva ? 'Reserva' : 'Venta'),
      hora: this.formatearHoraActividad(horaFuente)
    };
  }

  private formatearHoraActividad(fecha: unknown): string {
    if (!fecha) return '';
    const d = new Date(String(fecha));
    if (isNaN(d.getTime())) return String(fecha);
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}