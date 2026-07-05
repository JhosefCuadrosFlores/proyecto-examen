import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class BoletaService {
  private apiUrl = 'http://localhost:8080/api/boletas';

  constructor(private http: HttpClient) {}

  generar(dto: any): Observable<any> {
    console.log('BoletaService - generar');
    const token = localStorage.getItem('token');
    console.log('BoletaService - generar - token available:', !!token);
    if (token) {
      console.log('BoletaService - generar - token length:', token.length);
    }
    
    // Add headers explicitly to ensure token is sent
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    console.log('BoletaService - generar - full URL:', `${this.apiUrl}/generar`);
    return this.http.post<any>(`${this.apiUrl}/generar`, dto, { headers });
  }

  listarPorVendedor(vendedorId: number): Observable<any[]> {
    console.log('BoletaService - listarPorVendedor - vendedorId:', vendedorId);
    const token = localStorage.getItem('token');
    console.log('BoletaService - listarPorVendedor - token available:', !!token);
    if (token) {
      console.log('BoletaService - listarPorVendedor - token length:', token.length);
      
      // Try to decode token to see if it's valid
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('BoletaService - listarPorVendedor - token payload:', payload);
      } catch (e) {
        console.error('BoletaService - listarPorVendedor - error decoding token:', e);
      }
    }
    
    // Add headers explicitly to ensure token is sent
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    console.log('BoletaService - listarPorVendedor - full URL:', `${this.apiUrl}/vendedor/${vendedorId}`);
    return this.http.get<any[]>(`${this.apiUrl}/vendedor/${vendedorId}`, { headers }).pipe(
      catchError((err) => {
        console.warn('BoletaService - error listando boletas:', err);
        return of([]);
      })
    );
  }
}