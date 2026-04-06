import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAxglINJgS2Lw9G7Z5BOVBwS3NTwUH2RDw",
    authDomain: "expense-tracker-aa175.firebaseapp.com",
    projectId: "expense-tracker-aa175",
    storageBucket: "expense-tracker-aa175.firebasestorage.app",
    messagingSenderId: "930837422199",
    appId: "1:930837422199:web:dc88f96f270e391225a672",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
