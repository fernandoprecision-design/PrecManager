import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBrP55wO-_tV3yYmQoXceM9aH6BCNCm4cA",
  authDomain: "precmanager-f59ac.firebaseapp.com",
  projectId: "precmanager-f59ac",
  storageBucket: "precmanager-f59ac.firebasestorage.app",
  messagingSenderId: "736820474077",
  appId: "1:736820474077:web:cbe1b35b65ba1ee158ab34",
  measurementId: "G-5X49JSNJR7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Instância secundária para criar contas de clientes sem encerrar a sessão do Admin
const secondaryApp = initializeApp(firebaseConfig, 'SecondaryClientCreator');
export const secondaryAuth = getAuth(secondaryApp);
