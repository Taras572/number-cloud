import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// Замініть ці значення на ваші з Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCBrPs_EuZyzsYQxdnrvWU3v25VeD3rB48",
  authDomain: "number-plate-94d72.firebaseapp.com",
  projectId: "number-plate-94d72",
  storageBucket: "number-plate-94d72.firebasestorage.app",
  messagingSenderId: "636358884864",
  appId: "1:636358884864:web:6d316c023114728c5b22e5",
  measurementId: "G-ZJT1B4G0JM"
};

// Ініціалізація Firebase
const app = initializeApp(firebaseConfig);

// Експорт сервісів
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);