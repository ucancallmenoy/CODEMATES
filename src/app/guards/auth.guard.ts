import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { switchMap, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    console.log('Auth guard checking route:', state.url);
    
    // Get synchronous value first
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      console.log('Auth guard: User is authenticated synchronously');
      return true;
    }
    
    console.log('Auth guard: No synchronous user, checking observable...');
    
    // If no synchronous value, check the observable with a delay
    return new Promise<boolean>(resolve => {
      // Force a refresh of auth state
      this.authService.refreshAuthState();
      
      // Listen to the observable with a small delay
      setTimeout(() => {
        this.authService.currentUser$.pipe(take(1)).subscribe(user => {
          const authenticated = !!user;
          console.log(`Auth guard result after delay: ${authenticated ? 'Authenticated' : 'Not authenticated'}`);
          
          if (!authenticated) {
            this.router.navigate(['/login']);
          }
          
          resolve(authenticated);
        });
      }, 300); // Small delay to ensure Firebase has initialized
    });
  }
}