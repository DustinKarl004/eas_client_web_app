import { db, auth } from '../Javascript/firebase_config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    errorElement.style.display = 'none';

    try {
        // Authenticate user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if user has exam results for freshmen or transferees
        const freshmenExamResultsRef = doc(db, 'freshmen_examinees_result', user.uid);
        const transfereeExamResultsRef = doc(db, 'transferee_examinees_result', user.uid);
        const freshmenExamResultsSnap = await getDoc(freshmenExamResultsRef);
        const transfereeExamResultsSnap = await getDoc(transfereeExamResultsRef);

        if (freshmenExamResultsSnap.exists() || transfereeExamResultsSnap.exists()) {
            window.location.href = 'dashboard.html';
        } else {
            throw new Error("You don't have permission to access this portal.");
        }
    } catch (error) {
        let errorMessage = 'Invalid email or password.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'The email address is not valid.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No user found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'The password is incorrect.';
                break;
            default:
                errorMessage = error.message || errorMessage;
        }

        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
    }
});

function togglePassword() {
    const passwordField = document.getElementById("password");
    const passwordToggle = document.querySelector(".password-toggle");
    if (passwordField.type === "password") {
        passwordField.type = "text";
        passwordToggle.classList.remove("fa-eye-slash");
        passwordToggle.classList.add("fa-eye");
    } else {
        passwordField.type = "password";
        passwordToggle.classList.remove("fa-eye");
        passwordToggle.classList.add("fa-eye-slash");
    }
}

window.togglePassword = togglePassword;
