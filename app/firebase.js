// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTOge8YSS8_yycAMvOrpsmuoe-NIVJX4w",
  authDomain: "pantry-tracker-fba23.firebaseapp.com",
  projectId: "pantry-tracker-fba23",
  storageBucket: "pantry-tracker-fba23.appspot.com",
  messagingSenderId: "61911379463",
  appId: "1:61911379463:web:cd08c946efdfd8a83c44a2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();