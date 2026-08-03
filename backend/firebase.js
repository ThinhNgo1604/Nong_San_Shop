const { initializeApp, getApps } = require("firebase/app");
const { 
    getFirestore, 
    collection, 
    getDocs, 
    getDoc, 
    doc, 
    setDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where 
} = require("firebase/firestore");
const path = require("path");
const fs = require("fs");

let config = {};
try {
    config = require("../firebase-applet-config.json");
} catch (err) {
    console.warn("⚠️ không tìm thấy firebase-applet-config.json:", err.message);
}

const firebaseConfig = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = config.firestoreDatabaseId 
    ? getFirestore(app, config.firestoreDatabaseId)
    : getFirestore(app);

module.exports = {
    db,
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where
};
