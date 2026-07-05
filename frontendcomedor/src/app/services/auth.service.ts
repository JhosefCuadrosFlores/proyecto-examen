import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = API_CONFIG.authUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const user = localStorage.getItem('currentUser');
    if (user && user !== 'undefined') {
      try {
        this.currentUserSubject.next(JSON.parse(user));
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
        localStorage.removeItem('currentUser');
      }
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password })
      .pipe(tap(res => {
        if (res.token) {
          localStorage.setItem('token', res.token);

          let rol = 'CLIENTE';
          if (res.roles && res.roles.length > 0) {
            rol = res.roles[0].replace('ROLE_', '');
          }

          const usuario = {
            id: res.id,
            username: res.username,
            nombre: res.nombreCompleto,
            nombreCompleto: res.nombreCompleto,
            codigo: res.username?.toUpperCase(),
            rol,
            roles: res.roles
          };

          localStorage.setItem('currentUser', JSON.stringify(usuario));
          this.currentUserSubject.next(usuario);
        }
      }));
  }

  checkServerHealth(): Observable<boolean> {
    return this.http.get(`${API_CONFIG.menusUrl}/publicados`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    console.log('AuthService - getToken - called');
    const token = localStorage.getItem('token');
    console.log('AuthService - getToken - token from localStorage:', token);
    console.log('AuthService - getToken - token length:', token ? token.length : 0);
    
    // Check if token is valid
    if (token) {
      try {
        // Decode the token to check if it's valid
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('AuthService - getToken - token payload:', payload);
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          console.log('AuthService - getToken - token is expired');
          this.logout();
          return null;
        }
      } catch (e) {
        console.error('AuthService - getToken - error decoding token:', e);
        this.logout();
        return null;
      }
    } else {
      console.log('AuthService - getToken - no token found in localStorage');
    }
    
    console.log('AuthService - getToken - returning token:', token ? token.substring(0, 20) + '...' : null);
    return token;
  }

  getCurrentUser(): any {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw && raw !== 'undefined') {
        const stored = JSON.parse(raw);
        const merged = { ...(this.currentUserSubject.value || {}), ...stored };
        if (merged.id != null) {
          merged.id = Number(merged.id);
        }
        this.currentUserSubject.next(merged);
        return merged;
      }
    } catch (e) {
      console.error('Error reading currentUser from localStorage:', e);
    }
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const isLoggedIn = !!token;
    console.log('AuthService - isLoggedIn - result:', isLoggedIn);
    return isLoggedIn;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    const hasRole = user && user.rol === role;
    console.log('AuthService - hasRole - role:', role, 'result:', hasRole);
    return hasRole;
  }
}