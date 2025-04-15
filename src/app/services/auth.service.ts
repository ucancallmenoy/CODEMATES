import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  GoogleAuthProvider, signInWithPopup,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, signOut, User, onAuthStateChanged
} from 'firebase/auth';
import { FirebaseService } from './firebase.service';
import {
  doc, getDoc, setDoc, serverTimestamp
} from 'firebase/firestore';

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
      
      // Create/update user document in Firestore after Google sign-in
      await this.createUserDocument(result.user);
      
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
      
      // Important: Create user document in Firestore
      await this.createUserDocument(userCredential.user, { displayName: name });
      
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
      
      // Update the user document on sign-in
      if (result.user) {
        await this.updateLastActive(result.user.uid);
      }
      
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
  async getUserInfo(uid: string): Promise<any> {
    try {
      // First try to get from Firestore
      const userDocRef = doc(this.firebase.db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      
      // For the current user only, we can get info from auth
      const currentUser = this.firebase.auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        return {
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL
        };
      }
      
      console.warn('Could not find user info for:', uid);
      return null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }

  private async createUserDocument(user: User, additionalData: any = {}): Promise<void> {
    if (!user) return;
    
    try {
      // This will create the users collection if it doesn't exist
      const userRef = doc(this.firebase.db, 'users', user.uid);
      
      // Data to store in the user document
      const userData = {
        displayName: user.displayName || additionalData.displayName || 'Anonymous User',
        email: user.email || '',
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        ...additionalData
      };
      
      console.log('Creating user document:', userData);
      
      // Create or update the document
      await setDoc(userRef, userData, { merge: true });
      console.log('User document created/updated in Firestore');
      
      // Verify the document was created
      const checkDoc = await getDoc(userRef);
      console.log('Document exists after creation:', checkDoc.exists());
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }

  async ensureUserDocument(): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) return;
    
    console.log('Ensuring user document exists for:', user.email);
    
    try {
      // Create/update the user document
      await this.createUserDocument(user);
      
      // Verify it was created
      const userRef = doc(this.firebase.db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        console.log('User document verified:', docSnap.data());
      } else {
        console.error('Failed to create user document!');
      }
    } catch (error) {
      console.error('Error ensuring user document:', error);
    }
  }

  async updateLastActive(userId: string): Promise<void> {
    if (!userId) return;
    
    try {
      const userRef = doc(this.firebase.db, 'users', userId);
      await setDoc(userRef, { 
        lastActive: serverTimestamp() 
      }, { merge: true });
    } catch (error) {
      console.error('Error updating lastActive:', error);
    }
  }
  async updateUserProfile(displayName: string, photoURL?: string): Promise<boolean> {
    try {
      const user = this.firebase.auth.currentUser;
      if (!user) {
        console.error('Cannot update profile: No authenticated user');
        return false;
      }
      
      // Update the auth profile
      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL || user.photoURL
      });
      
      // Update the Firestore document
      await this.createUserDocument(user, { 
        displayName: displayName,
        photoURL: photoURL || user.photoURL
      });
      
      console.log('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }
}