import { inject, Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {

  const authService = inject(AuthService);

  if(authService.isLoggedIn)
    return true;

  authService.loginRedirectUrl = state.url;

  inject(Router).navigate(['/login']);

  return false;
}
