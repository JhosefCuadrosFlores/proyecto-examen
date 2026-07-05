import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const expectedRole = route.data['role'];
  
  // Check if user is logged in
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }
  
  const currentUser = authService.getCurrentUser();
  
  // Check if route requires a specific role
  if (expectedRole && currentUser.rol !== expectedRole) {
    // Redirect based on user role
    if (currentUser.rol === 'VENDEDOR') {
      router.navigate(['/vendedor']);
      return false;
    } else if (currentUser.rol === 'ADMIN') {
      router.navigate(['/admin']);
      return false;
    } else {
      router.navigate(['/']);
      return false;
    }
  }

  return true;
};