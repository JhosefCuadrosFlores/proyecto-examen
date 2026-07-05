import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Auth Interceptor - START - Processing request to:', req.url);
  const token = localStorage.getItem('token');
  
  // Log para debugging
  console.log('Auth Interceptor - Token available:', !!token);
  console.log('Auth Interceptor - Request method:', req.method);
  console.log('Auth Interceptor - Request headers:', req.headers.keys());
  
  // Si hay token Y es una solicitud a nuestro backend, agregar el token
  if (token && req.url.startsWith('http://localhost:8080')) {
    console.log('Auth Interceptor - Adding Authorization header for backend request');
    console.log('Auth Interceptor - Token being sent:', token.substring(0, 20) + '...'); // Only show first 20 chars for security
    
    // Check if token is valid before sending
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Auth Interceptor - Token payload:', payload);
      
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        console.log('Auth Interceptor - Token is expired, not sending');
        // Remove expired token
        localStorage.removeItem('token');
      } else {
        const clonedReq = req.clone({
          setHeaders: { 
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Auth Interceptor - Request with auth header:', clonedReq.headers.get('Authorization'));
        console.log('Auth Interceptor - Final request URL:', clonedReq.url);
        console.log('Auth Interceptor - Final request method:', clonedReq.method);
        console.log('Auth Interceptor - END - Sending request with auth header');
        
        // Handle 401 responses
        return next(clonedReq).pipe(
          tap({
            error: (error) => {
              if (error.status === 401) {
                console.log('Auth Interceptor - Received 401 response, removing token');
                localStorage.removeItem('token');
              }
            }
          })
        );
      }
    } catch (e) {
      console.error('Auth Interceptor - Error decoding token:', e);
      // Remove invalid token
      localStorage.removeItem('token');
    }
  }
  
  // Para solicitudes sin token o a otros servicios, enviar sin modificar
  console.log('Auth Interceptor - Sending request without Authorization header (guest mode)');
  console.log('Auth Interceptor - Final request URL:', req.url);
  console.log('Auth Interceptor - Final request method:', req.method);
  console.log('Auth Interceptor - END - Sending request without auth header');
  
  // Handle 401 responses for requests without auth
  return next(req).pipe(
    tap({
      error: (error) => {
        if (error.status === 401) {
          console.log('Auth Interceptor - Received 401 response on request without auth, removing token if exists');
          localStorage.removeItem('token');
        }
      }
    })
  );
};