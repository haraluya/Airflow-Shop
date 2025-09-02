// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCOFeD1GRbNBGWJApoesWIDgi5rSFOvvSM",
  authDomain: "airflow-ddb4f.firebaseapp.com",
  projectId: "airflow-ddb4f",
  storageBucket: "airflow-ddb4f.firebasestorage.app",
  messagingSenderId: "1024248082490",
  appId: "1:1024248082490:web:eff1170d891b3642a80503",
  measurementId: "G-F3CZ299583"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);