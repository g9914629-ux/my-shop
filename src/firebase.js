import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA92nfsqnAsCQ-FFvNBib0Ct6pIVAxl87Y",
  authDomain: "my-shop-5eca0.firebaseapp.com",
  projectId: "my-shop-5eca0",
  storageBucket: "my-shop-5eca0.firebasestorage.app",
  messagingSenderId: "1031053341412",
  appId: "1:1031053341412:web:aa907f381e15316c5d32f1",
  measurementId: "G-1CSR07J3DQ"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)