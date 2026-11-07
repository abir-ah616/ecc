import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const SUPER_ADMIN_EMAIL = 'johncenahzoppy@gmail.com';

const firebaseConfig = {
  projectId: 'esp-calc-oppy-2026',
  appId: '1:497488916740:web:7e359f0f9cabd656dae051',
  storageBucket: 'esp-calc-oppy-2026.firebasestorage.app',
  apiKey: 'AIzaSyDBAVt23kOG8EzzwOVcQ1sTJlce_wqovxo',
  authDomain: 'esp-calc-oppy-2026.firebaseapp.com',
  messagingSenderId: '497488916740',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
