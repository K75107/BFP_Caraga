// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAkM3zR6PaGb_gbevl7cNMZpZoZUhKcNyc",
  authDomain: "accountingsystem-a2485.firebaseapp.com",
  databaseURL: "https://accountingsystem-a2485-default-rtdb.firebaseio.com",
  projectId: "accountingsystem-a2485",
  storageBucket: "accountingsystem-a2485.appspot.com",
  messagingSenderId: "193430668406",
  appId: "1:193430668406:web:505a776ff97859de180b57",
  measurementId: "G-4J9H00NECE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);