
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Check if all required environment variables are present.
const isConfigComplete = 
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId;


if (typeof window !== "undefined" && !getApps().length) {
    try {
        // Initialize with config only if all variables are set, otherwise let Firebase auto-configure.
        app = isConfigComplete ? initializeApp(firebaseConfig) : initializeApp({});
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
    } catch (error) {
        console.error("Firebase initialization error", error);
        //@ts-ignore
        app = auth = db = storage = null;
    }
} else if (getApps().length) {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} else {
    // This case is for server-side rendering where the app might not be initialized yet.
    // It will be initialized on the client.
    //@ts-ignore
    app = auth = db = storage = null;
}


export { app, db, auth, storage };
