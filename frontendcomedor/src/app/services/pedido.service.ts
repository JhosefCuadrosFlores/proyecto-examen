import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private apiUrl = 'http://localhost:8080/api/pedidos';

  constructor(private http: HttpClient) {}

  confirmarReserva(dto: any): Observable<any> {
    // Ensure we're sending the correct headers
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<any>(`${this.apiUrl}/confirmar`, dto, { headers });
  }

  listarPorUsuario(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }
}