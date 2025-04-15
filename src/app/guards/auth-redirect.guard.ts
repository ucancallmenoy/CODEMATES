import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthRedirectGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    // If user is already logged in, redirect to chat room
    if (this.authService.getCurrentUser()) {
      this.router.navigate(['/chat-room']);
      return false;
    }
    
    // Allow access to login/register pages if not logged in
    return true;
  }
}