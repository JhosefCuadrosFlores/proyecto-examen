import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private apiUrl = 'http://localhost:8080/api/menus';

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<any[]> {
    console.log('MenuService - listarTodos');
    const token = localStorage.getItem('token');
    console.log('MenuService - listarTodos - token available:', !!token);
    if (token) {
      console.log('MenuService - listarTodos - token length:', token.length);
    }
    
    // Add headers explicitly to ensure token is sent
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    console.log('MenuService - listarTodos - full URL:', this.apiUrl);
    return this.http.get<any[]>(this.apiUrl, { headers });
  }

  listarPublicados(): Observable<any[]> {
    console.log('MenuService - listarPublicados');
    const token = localStorage.getItem('token');
    console.log('MenuService - listarPublicados - token available:', !!token);
    if (token) {
      console.log('MenuService - listarPublicados - token length:', token.length);
    }
    
    // Add headers explicitly to ensure token is sent
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    console.log('MenuService - listarPublicados - full URL:', `${this.apiUrl}/publicados`);
    return this.http.get<any[]>(`${this.apiUrl}/publicados`, { headers });
  }

  obtenerPorId(id: number): Observable<any> {
    console.log('MenuService - obtenerPorId - id:', id);
    const token = localStorage.getItem('token');
    console.log('MenuService - obtenerPorId - token available:', !!token);
    if (token) {
      console.log('MenuService - obtenerPorId - token length:', token.length);
    }
    
    // Add headers explicitly to ensure token is sent
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    console.log('MenuService - obtenerPorId - full URL:', `${this.apiUrl}/${id}`);
    return this.http.get<any>(`${this.apiUrl}/${id}`, { headers });
  }

  porHorario(horario: string): Observable<any[]> {
    console.log('MenuService - porHorario - horario:', horario);
    const token = localStorage.getItem('token');
    console.log('MenuService - porHorario - token available:', !!token);
    if (token) {
      console.log('MenuService - porHorario - token length:', token.length);
    }
    
    // Add headers explicitly to ensure token is sent
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    console.log('MenuService - porHorario - full URL:', `${this.apiUrl}/horario/${horario}`);
    return this.http.get<any[]>(`${this.apiUrl}/horario/${horario}`, { headers });
  }

  crear(menu: any): Observable<any> {
    console.log('MenuService - crear');
    const token = localStorage.getItem('token');
    console.log('MenuService - crear - token available:', !!token);
    if (token) {
      console.log('MenuService - crear - token length:', token.length);
    }
    
    // Add headers explicitly to ensure token is sent
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    console.log('MenuService - crear - full URL:', this.apiUrl);
    return this.http.post<any>(this.apiUrl, menu, { headers });
  }

  actualizar(id: number, menu: any): Observable<any> {
    console.log('MenuService - actualizar - id:', id);
    const token = localStorage.getItem('token');
    console.log('MenuService - actualizar - token available:', !!token);
    if (token) {
      console.log('MenuService - actualizar - token length:', token.length);
    }
    
    // Add headers explicitly to ensure token is sent
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    console.log('MenuService - actualizar - full URL:', `${this.apiUrl}/${id}`);
    return this.http.put<any>(`${this.apiUrl}/${id}`, menu, { headers });
  }

  eliminar(id: number): Observable<void> {
    console.log('MenuService - eliminar - id:', id);
    const token = localStorage.getItem('token');
    console.log('MenuService - eliminar - token available:', !!token);
    if (token) {
      console.log('MenuService - eliminar - token length:', token.length);
    }
    
    // Add headers explicitly to ensure token is sent
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    console.log('MenuService - eliminar - full URL:', `${this.apiUrl}/${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }

  listarPorVendedor(vendedorId: number): Observable<any[]> {
    console.log('MenuService - listarPorVendedor - vendedorId:', vendedorId);
    const token = localStorage.getItem('token');
    console.log('MenuService - Token in localStorage:', token);
    if (token) {
      console.log('MenuService - listarPorVendedor - token length:', token.length);
      
      // Try to decode token to see if it's valid
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('MenuService - listarPorVendedor - token payload:', payload);
      } catch (e) {
        console.error('MenuService - listarPorVendedor - error decoding token:', e);
      }
    }
    
    // Add headers explicitly to ensure token is sent
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    console.log('MenuService - listarPorVendedor - full URL:', `${this.apiUrl}/vendedor/${vendedorId}`);
    return this.http.get<any[]>(`${this.apiUrl}/vendedor/${vendedorId}`, { headers });
  }
}