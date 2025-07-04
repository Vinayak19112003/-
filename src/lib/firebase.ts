
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAkbLBTJo9-6OSH009jqw0dtx-xKxjE_VQ",
  authDomain: "tradevision-journal-pss69.firebaseapp.com",
  projectId: "tradevision-journal-pss69",
  storageBucket: "tradevision-journal-pss69.firebasestorage.app",
  messagingSenderId: "790628334512",
  appId: "1:790628334512:web:283fbaee6bb6aa1957b475"
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, db, auth, storage };
