import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

// Inserisci qui la tua config Firebase dalle impostazioni della console Firebase!
const firebaseConfig = {
  apiKey: "AIzaSyBlqLEYjO2_XcKRK2cQXlvT1BJyCOeNs74",
  authDomain: "chat-famiglia.firebaseapp.com",
  projectId: "chat-famiglia",
  storageBucket: "chat-famiglia.firebasestorage.app",
  messagingSenderId: "384761033758",
  appId: "1:384761033758:web:93d243a6539eed2f602a0f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
