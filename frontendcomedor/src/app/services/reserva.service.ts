import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface FiltroVendedorReservas {
  vendedorId?: number;
  username?: string;
  menuIds?: number[];
}

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private apiUrl = 'http://localhost:8080/api/reservas';
  private vendedorApiUrl = 'http://localhost:8080/api/vendedor-reservas';

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  listarPorUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuario/${usuarioId}`, { headers: this.authHeaders() });
  }

  listarParaVendedor(options: FiltroVendedorReservas): Observable<any[]> {
    const vendedorId = Number(options.vendedorId) || 0;
    const username = String(options.username || '').trim().toLowerCase();
    const menuIdSet = new Set(
      (options.menuIds || []).map(id => Number(id)).filter(id => id > 0)
    );

    const filtrar = (lista: any[]): any[] => {
      const map = new Map<number, any>();
      (lista || []).forEach(r => {
        if (r?.id == null) return;
        const menuId = Number(r.menu?.id);
        const menuVendedorId = Number(r.menu?.vendedor?.id);
        const menuVendedorUser = String(r.menu?.vendedor?.username || '').toLowerCase();

        const coincide =
          (menuIdSet.size > 0 && menuIdSet.has(menuId)) ||
          (vendedorId > 0 && menuVendedorId === vendedorId) ||
          (username.length > 0 && menuVendedorUser === username);

        if (coincide) {
          map.set(Number(r.id), r);
        }
      });

      return Array.from(map.values()).sort(
        (a, b) => new Date(b.fechaReserva || 0).getTime() - new Date(a.fechaReserva || 0).getTime()
      );
    };

    if (vendedorId > 0) {
      return this.http.get<any[]>(`${this.vendedorApiUrl}/vendedor/${vendedorId}`, { headers: this.authHeaders() }).pipe(
        map(directas => filtrar(directas)),
        catchError(() =>
          this.http.get<any[]>(`${this.apiUrl}/todas`, { headers: this.authHeaders() }).pipe(
            map(todas => filtrar(todas)),
            catchError(() => of([]))
          )
        )
      );
    }

    return this.http.get<any[]>(`${this.apiUrl}/todas`, { headers: this.authHeaders() }).pipe(
      map(todas => filtrar(todas)),
      catchError(() => of([]))
    );
  }

  /** @deprecated Usar listarParaVendedor */
  listarPorVendedor(vendedorId: number): Observable<any[]> {
    return this.listarParaVendedor({ vendedorId });
  }

  listarTodas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/todas`, { headers: this.authHeaders() });
  }

  actualizarEstado(id: number, estado: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/estado?estado=${estado}`,
      {},
      { headers: this.authHeaders() }
    );
  }
}
