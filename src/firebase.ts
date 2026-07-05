import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously, onAuthStateChanged, updateProfile, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWJRd_p8ES-JlEVfO_xewX-uNQEvUosWs",
  authDomain: "celebiylevs.firebaseapp.com",
  projectId: "celebiylevs",
  storageBucket: "celebiylevs.firebasestorage.app",
  messagingSenderId: "30661273361",
  appId: "1:30661273361:web:41419af1675d30eff2ceb0",
  measurementId: "G-NT2P4XDJ68"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const { user } = await signInWithPopup(auth, googleProvider);
    await ensureUserDoc(user);
  } catch (error) {
    console.error("Google login error:", error);
  }
};

export const signUpWithEmail = async (email: string, pass: string, name: string, avatarUrl: string) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(user, { displayName: name, photoURL: avatarUrl });
  await ensureUserDoc(user);
  return user;
};

export const signInWithEmail = async (email: string, pass: string) => {
  const { user } = await signInWithEmailAndPassword(auth, email, pass);
  await ensureUserDoc(user);
  return user;
};

export const signInAsGuestWithDetails = async (displayName: string, photoURL: string) => {
  try {
    const { user } = await signInAnonymously(auth);
    await updateProfile(user, { displayName, photoURL });
    await ensureUserDoc(user);
    return user;
  } catch (error) {
    console.error("Anonymous login error:", error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
  }
};

export const ensureUserDoc = async (user: any) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    const randomTag = Math.random().toString(36).substring(2, 6).toUpperCase();
    const tag = `${(user.displayName || 'Oyuncu').replace(/\s+/g, '')}#${randomTag}`;
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || 'Oyuncu',
      photoURL: user.photoURL || 'https://via.placeholder.com/40',
      userTag: tag,
      friends: [],
      createdAt: serverTimestamp()
    });
  }
};
