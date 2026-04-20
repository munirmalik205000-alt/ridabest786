"""Firebase configuration reference for the Rida786 project.

This module exposes the Firebase web-SDK config values so they can be served
to the frontend if needed. The backend itself keeps using its own JWT auth —
Firebase is initialised on the client (see /app/frontend/src/lib/firebase.js).
"""
import os

FIREBASE_CONFIG = {
    "apiKey": os.environ.get("FIREBASE_API_KEY", "AIzaSyAY1pH3_AsxohECX98prGeu3Vmdkjyq8G0"),
    "authDomain": os.environ.get("FIREBASE_AUTH_DOMAIN", "rida786.firebaseapp.com"),
    "projectId": os.environ.get("FIREBASE_PROJECT_ID", "rida786"),
    "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET", "rida786.firebasestorage.app"),
    "messagingSenderId": os.environ.get("FIREBASE_MESSAGING_SENDER_ID", "277888202885"),
    "appId": os.environ.get("FIREBASE_APP_ID", "1:277888202885:web:96ec0e789403ff3799d1ec"),
}
