import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

  app = initializeApp(this.firebaseConfig);
  db = getFirestore(this.app);
  auth = getAuth(this.app);
}