import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth-guard.service';

export const routes: Routes = [
  {
    path: '',
    loadComponent: ()=> import('./components/home/home.component').then(m=>m.HomeComponent),
    canActivate: [AuthGuard],
    title: 'Home'
  },
  {
    path: 'login',
    loadComponent: ()=> import('./components/login/login.component').then(m=>m.LoginComponent),
    title: 'Login'
  }
];
