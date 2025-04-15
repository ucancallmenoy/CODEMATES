import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firebaseConfig = {
    apiKey: "AIzaSyDSuB6Kx5ivi18_Jpr76zOQZxYkrSgrQ9c",
    authDomain: "codemates-e8bdb.firebaseapp.com",
    projectId: "codemates-e8bdb",
    storageBucket: "codemates-e8bdb.firebasestorage.app",
    messagingSenderId: "391761043416",
    appId: "1:391761043416:web:b8809278849543a3899cad"
  };

  private _app = initializeApp(this.firebaseConfig);
  private _auth = getAuth(this._app);
  private _db = getFirestore(this._app);

  get app() {
    return this._app;
  }

  get auth() {
    return this._auth;
  }

  get db() {
    return this._db;
  }

  constructor() {
    console.log('Firebase initializer service created');
    
    // Force persistence mode to LOCAL
    setPersistence(this._auth, browserLocalPersistence).then(() => {
      console.log('Firebase persistence set to LOCAL');
    }).catch(error => {
      console.error('Error setting persistence:', error);
    });
    
    // Add a listener to log auth state changes
    onAuthStateChanged(this._auth, (user) => {
      console.log(`Auth state changed in initializer: ${user ? user.email : 'No user'}`);
    }, (error) => {
      console.error('Auth state change error:', error);
    });
  }

  async getDocument(collection: string, docId: string) {
    const docRef = doc(this.db, collection, docId);
    return await getDoc(docRef);
  }
}