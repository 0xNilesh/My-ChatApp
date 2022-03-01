import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/database";
import history from "../../history";

const firebaseConfig = {
    apiKey: "AIzaSyD8NRfe6BNEHXWepQxMrU8sL19OHpnhG28",
    authDomain: "my-whatsapp-clone-9769a.firebaseapp.com",
    projectId: "my-whatsapp-clone-9769a",
    storageBucket: "my-whatsapp-clone-9769a.appspot.com",
    messagingSenderId: "157503978004",
    appId: "1:157503978004:web:a0c0a7ba4f84cf1f9dc501",
};

var app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
    app.firestore();
} else {
    app = firebase.app(); // if already initialized, use that one
}

const auth = app.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

const googleLogin = () => async () => {
    try {
        const user = await auth.signInWithPopup(googleProvider);

        // Storing user information in the firestore
        if (user !== undefined && user.additionalUserInfo.isNewUser) {
            await app.firestore().collection("users").doc(user.user.uid).set({
                displayName: user.user.displayName,
                email: user.user.email,
                createdAt: Date.now(),
                uid: user.user.uid,
            });
        }

        // After successful sign in, redirect user to main page
        history.push("/chats");
    } catch (error) {
        console.log(error);
    }
};

const logout = () => {
    auth.signOut();
    history.push("/chats");
};

export { auth, googleLogin, logout, app };
