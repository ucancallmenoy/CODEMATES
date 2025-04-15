import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  form = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  loading = false;
  error: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  async onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const success = await this.authService.register(
        this.form.name,
        this.form.email,
        this.form.password
      );
      
      if (success) {
        this.router.navigate(['/']);
      } else {
        this.error = 'Registration failed. Please try again.';
      }
    } catch (err: any) {
      this.error = err.message || 'Registration failed';
    } finally {
      this.loading = false;
    }
  }

  private validateForm(): boolean {
    if (!this.form.name || !this.form.email || !this.form.password) {
      this.error = 'Please fill all required fields';
      return false;
    }
    
    if (this.form.password !== this.form.confirmPassword) {
      this.error = 'Passwords do not match';
      return false;
    }
    
    if (this.form.password.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return false;
    }
    
    return true;
  }
}