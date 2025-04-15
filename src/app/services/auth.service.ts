import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithPopup, GoogleAuthProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, signOut, User
} from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private firebaseConfig = {
    apiKey: "AIzaSyDSuB6Kx5ivi18_Jpr76zOQZxYkrSgrQ9c",
  authDomain: "codemates-e8bdb.firebaseapp.com",
  projectId: "codemates-e8bdb",
  storageBucket: "codemates-e8bdb.firebasestorage.app",
  messagingSenderId: "391761043416",
  appId: "1:391761043416:web:b8809278849543a3899cad",
  };

  private app = initializeApp(this.firebaseConfig);
  private auth = getAuth(this.app);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router) {
    // Listen to authentication state changes
    this.auth.onAuthStateChanged(user => {
      console.log('Auth state changed:', user);
      this.currentUserSubject.next(user);
    });
  }

  // Get the current user
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<boolean> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      console.log('Google sign in successful:', result.user);
      return true;
    } catch (error) {
      console.error('Error during Google sign in:', error);
      return false;
    }
  }

  // Register with email and password
  async register(name: string, email: string, password: string): Promise<boolean> {
    try {
      console.log('Registering user:', email);
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      
      // Update profile with the name
      await updateProfile(userCredential.user, { 
        displayName: name 
      });
      
      console.log('Registration successful:', userCredential.user);
      return true;
    } catch (error) {
      console.error('Error during registration:', error);
      return false;
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<boolean> {
    try {
      console.log('Signing in user:', email);
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      console.log('Sign in successful:', userCredential.user);
      return true;
    } catch (error) {
      console.error('Error during sign in:', error);
      return false;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('User signed out');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }
}