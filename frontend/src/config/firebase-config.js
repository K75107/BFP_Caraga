// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAkM3zR6PaGb_gbevl7cNMZpZoZUhKcNyc",
  authDomain: "accountingsystem-a2485.firebaseapp.com",
  databaseURL: "https://accountingsystem-a2485-default-rtdb.firebaseio.com",
  projectId: "accountingsystem-a2485",
  storageBucket: "accountingsystem-a2485.appspot.com",
  messagingSenderId: "193430668406",
  appId: "1:193430668406:web:505a776ff97859de180b57",
  measurementId: "G-4J9H00NECE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

// Connect to emulators during development
if (process.env.NODE_ENV === "development") {
  // Firestore Emulator
  connectFirestoreEmulator(db, "127.0.0.1", 8200);

  // Authentication Emulator
  connectAuthEmulator(auth, "http://127.0.0.1:8000");

  // Realtime Database Emulator
  connectDatabaseEmulator(realtimeDb, "localhost", 9000);

  console.log("Connected to Firebase emulators.");
}
