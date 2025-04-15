import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { filter, first } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'CODEMATES';
  authDebug = false; // Set to true for debugging
  authStatus = 'Checking...';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit() {
    console.log('App component initialized');

    if (this.authDebug) {
      this.authService.currentUser$.subscribe(user => {
        this.authStatus = user ? `Logged in as ${user.email}` : 'Not logged in';
      });
    }
    
    // Force a refresh of the auth state
    const isAuthenticated = this.authService.refreshAuthState();
    console.log('Manual auth refresh result:', isAuthenticated);
    
    // Listen for auth state changes with a delay to ensure Firebase has time to initialize
    setTimeout(() => {
      this.authService.currentUser$
        .pipe(first())
        .subscribe(user => {
          const currentRoute = this.router.url;
          console.log(`Auth state in app component (after delay): ${user ? user.email : 'No user'}`);
          
          if (user) {
            // User is authenticated
            if (currentRoute === '/' || currentRoute === '/login' || currentRoute === '/register') {
              console.log('Redirecting authenticated user to chat room');
              this.router.navigate(['/chat-room']);
            }
          } else {
            // No authentication
            if (currentRoute !== '/login' && currentRoute !== '/register') {
              console.log('No authenticated user, redirecting to login');
              this.router.navigate(['/login']);
            }
          }
        });
    }, 500); // Small delay to ensure Firebase has initialized
  }
}