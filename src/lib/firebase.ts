
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAkbLBTJo9-6OSH009jqw0dtx-xKxjE_VQ",
  authDomain: "tradevision-journal-pss69.firebaseapp.com",
  projectId: "tradevision-journal-pss69",
  storageBucket: "tradevision-journal-pss69.appspot.com",
  messagingSenderId: "790628334512",
  appId: "1:790628334512:web:283fbaee6bb6aa1957b475"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (typeof window !== "undefined") {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (error) {
      console.error("Firebase initialization error", error);
    }
  } else {
    app = getApp();
  }
  
  if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } else {
    // @ts-ignore
    auth = db = storage = null;
  }
} else {
    // @ts-ignore
    app = auth = db = storage = null;
}

export { app, db, auth, storage };
