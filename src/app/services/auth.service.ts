import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  GoogleAuthProvider, signInWithPopup,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, signOut, User, onAuthStateChanged
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(
    private firebase: FirebaseService,
    private router: Router
  ) {
    console.log('Auth service constructor');
    
    // Listen to authentication state changes
    onAuthStateChanged(this.firebase.auth, (user) => {
      console.log('Auth state changed in service:', user ? user.email : 'No user');
      this.currentUserSubject.next(user);
      
      // Store user info in localStorage as backup
      if (user) {
        localStorage.setItem('user_email', user.email || '');
        localStorage.setItem('user_displayName', user.displayName || '');
        localStorage.setItem('user_uid', user.uid);
      } else {
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_displayName');
        localStorage.removeItem('user_uid');
      }
    });
    
    // Check local storage for backup authentication info
    this.checkStoredAuthData();
  }
  
  // Get the current user
  getCurrentUser(): User | null {
    const user = this.firebase.auth.currentUser;
    if (user) {
      return user;
    }
    
    // If no user in Firebase, check localStorage as backup
    const uid = localStorage.getItem('user_uid');
    if (uid) {
      console.warn('User found in localStorage but not in Firebase auth state');
      // Force refresh auth state
      this.refreshAuthState();
    }
    
    return null;
  }
  
  // Check localStorage for user data as a backup
  private checkStoredAuthData() {
    const uid = localStorage.getItem('user_uid');
    if (uid && !this.firebase.auth.currentUser) {
      console.log('Found user data in localStorage but not in Firebase');
      // Don't create fake user object, just log the discrepancy
    }
  }
  
  // Manually refresh the auth state (useful after a page reload)
  refreshAuthState() {
    const user = this.firebase.auth.currentUser;
    console.log('Manual refresh auth state:', user ? user.email : 'No user');
    this.currentUserSubject.next(user);
    return !!user;
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<boolean> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.firebase.auth, provider);
      console.log('Google sign in successful');
      return true;
    } catch (error) {
      console.error('Error during Google sign in:', error);
      return false;
    }
  }

  // Register with email and password
  async register(name: string, email: string, password: string): Promise<boolean> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.firebase.auth,
        email,
        password
      );
      
      // Update profile with the name
      await updateProfile(userCredential.user, { displayName: name });
      console.log('Registration successful');
      return true;
    } catch (error) {
      console.error('Error during registration:', error);
      return false;
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<boolean> {
    try {
      const result = await signInWithEmailAndPassword(
        this.firebase.auth,
        email,
        password
      );
      console.log('Sign in successful');
      return true;
    } catch (error) {
      console.error('Error during sign in:', error);
      return false;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(this.firebase.auth);
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_displayName');
      localStorage.removeItem('user_uid');
      console.log('Sign out successful');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }
}