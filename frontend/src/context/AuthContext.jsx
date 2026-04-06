import React, { createContext, useState, useContext, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import api from '../utils/api';

const AuthContext = createContext();

// Helper: after Firebase auth, send token to backend and store user
const authenticateWithBackend = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    const { data } = await api.post('/auth/firebase', { idToken });

    return {
        uid: data.uid,
        email: data.email,
        name: data.name,
        photoURL: data.photoURL,
        isNewUser: data.isNewUser,
        token: data.token,
    };
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount: restore user from localStorage and listen for Firebase auth state
    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Failed to parse userInfo:', error);
                localStorage.removeItem('userInfo');
            }
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (!firebaseUser && !localStorage.getItem('userInfo')) {
                setUser(null);
            }
            setLoading(false);
        });

        const timeout = setTimeout(() => setLoading(false), 1500);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    // Sign in with Google via Firebase popup
    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const userData = await authenticateWithBackend(result.user);
            setUser(userData);
            localStorage.setItem('userInfo', JSON.stringify(userData));
            return userData;
        } catch (error) {
            console.error('Google Sign-In error:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Sign-in was cancelled.');
            }
            if (error.code === 'auth/popup-blocked') {
                throw new Error('Pop-up was blocked. Please allow pop-ups for this site.');
            }
            throw new Error(error.response?.data?.message || error.message || 'Google Sign-In failed.');
        }
    };

    // Sign up with email and password
    const signUpWithEmail = async (email, password) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const userData = await authenticateWithBackend(result.user);
            setUser(userData);
            localStorage.setItem('userInfo', JSON.stringify(userData));
            return userData;
        } catch (error) {
            console.error('Email Sign-Up error:', error);
            if (error.code === 'auth/email-already-in-use') {
                throw new Error('An account with this email already exists.');
            }
            if (error.code === 'auth/weak-password') {
                throw new Error('Password must be at least 6 characters.');
            }
            if (error.code === 'auth/invalid-email') {
                throw new Error('Please enter a valid email address.');
            }
            throw new Error(error.response?.data?.message || error.message || 'Sign up failed.');
        }
    };

    // Sign in with email and password
    const signInWithEmail = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const userData = await authenticateWithBackend(result.user);
            setUser(userData);
            localStorage.setItem('userInfo', JSON.stringify(userData));
            return userData;
        } catch (error) {
            console.error('Email Sign-In error:', error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                throw new Error('Invalid email or password.');
            }
            if (error.code === 'auth/invalid-email') {
                throw new Error('Please enter a valid email address.');
            }
            if (error.code === 'auth/too-many-requests') {
                throw new Error('Too many failed attempts. Please try again later.');
            }
            throw new Error(error.response?.data?.message || error.message || 'Sign in failed.');
        }
    };

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('userInfo', JSON.stringify(userData));
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Firebase sign out error:', error);
        }
        setUser(null);
        localStorage.removeItem('userInfo');
    };

    return (
        <AuthContext.Provider value={{ user, signInWithGoogle, signUpWithEmail, signInWithEmail, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
