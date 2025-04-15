import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  formData = {
    email: '',
    password: ''
  };
  loading = false;
  error: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  async signInWithGoogle(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const success = await this.authService.signInWithGoogle();
      if (success) {
        // Navigate to home page instead of root
        this.router.navigate(['/chat-room']);
      } else {
        this.error = 'Failed to sign in with Google. Please try again.';
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to sign in with Google';
    } finally {
      this.loading = false;
    }
  }

  async signInWithEmail(): Promise<void> {
    if (!this.formData.email || !this.formData.password) {
      this.error = 'Please enter both email and password';
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const success = await this.authService.signIn(
        this.formData.email,
        this.formData.password
      );
      
      if (success) {
        // Navigate to home page instead of root
        this.router.navigate(['/chat-room']);
      } else {
        this.error = 'Invalid email or password';
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to sign in';
    } finally {
      this.loading = false;
    }
  }
  
}