import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  constructor(private router: Router) { }

  signInWithGoogle(): void {
    // This is just a placeholder function
    console.log('Google sign-in clicked');
    
    // For demo purposes, navigate to the dashboard after a short delay
    setTimeout(() => {
      this.router.navigate(['/chat-room']);
    }, 1000);
  }
}