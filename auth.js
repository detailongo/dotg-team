import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

export const firebaseConfig = {
    apiKey: "AIzaSyBMVa4EhYrz2NyYBdaVMJTS-JjfUIQDagQ",
    authDomain: "detail-on-the-go-universal.firebaseapp.com",
    projectId: "detail-on-the-go-universal",
    storageBucket: "detail-on-the-go-universal.firebasestorage.app",
    messagingSenderId: "896343340170",
    appId: "1:896343340170:web:473d7fd278d40649de2973",
    measurementId: "G-W2D7QKW2YS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  try {
    const result = await signInWithPopup(auth, provider);
    console.log('Logged in user:', {
      email: result.user.email,
      displayName: result.user.displayName,
      uid: result.user.uid
    });
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google', error);
  }
};

export const logoutUser = async () => {
  try {
    const user = auth.currentUser;
    console.log('Logging out user:', user?.email);
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out', error);
  }
};

export const onAuthStateChangedListener = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? `User ${user.email} is signed in` : 'User signed out');
    callback(user);
  });
};

export const getUser = () => {
  return auth.currentUser;
};