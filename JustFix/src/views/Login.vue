<style lang="css">
@import '../../src/styles.css';
</style>

<template>
    <div class="full-height">
        <!-- Left Section with Background -->
        <div class="left-section">
            <!-- You can add content here if needed -->
        </div>

        <!-- Right Section with the login form -->
        <div class="right-section">
            <div class="card">
                <!-- <button class="btn google-btn d-flex align-items-center mx-auto" id="googleSignInBtn"
                    style="padding: 8px 12px;">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo"
                        width="20">
                    Sign in with Google
                </button>
                <hr class="solid"> -->
                <div class="card-divider">
                    <h4>Login to JustFix</h4>
                </div>
                <div class="card-section">
                    <form id="loginForm" @submit.prevent="login">
                        <div class="form-group mb-2">
                            <label for="email">Email</label>
                            <input v-model="email" type="email" id="email" class="form-control"
                                placeholder="Enter your email" required>
                        </div>

                        <div class="form-group mb-2">
                            <label for="password">Password</label>
                            <input v-model="password" type="password" id="password" class="form-control"
                                placeholder="Enter your password" required>
                        </div>

                        <!-- Only for the "Remember me" checkbox -->
                        <div class="form-group mb-2 d-flex justify-content-between">
                            <div class="form-check d-inline-flex align-items-center">
                                <input v-model="rememberMe" type="checkbox" id="rememberMe"
                                    class="form-check-input me-2">
                                <label for="rememberMe" class="form-check-label mb-0" style="padding-top: 5px;">Remember
                                    me</label>
                            </div>
                            <a href="#" id="forgotPassword" class="ms-auto d-inline-flex align-items-center"
                                style="text-decoration: none; color: black; padding-top: 5px;">Forgot Password?</a>
                        </div>
                        <br>
                        <button type="submit" class="button">Login</button>
                    </form>
                    <div style="text-align: center; padding-top: 10px;">
                        <span>Don't have an account? <router-link :to="{ name: 'register' }"
                                style="text-decoration: none; color: black; font-weight: bolder;">Register</router-link></span>
                    </div>
                    <p v-if="errorMessage" id="errorMessage" style="color: red;">{{ errorMessage }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, } from '../main'; // Adjust the import to your Firebase configuration
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'; // Ensure proper Firestore import
import Cookies from 'js-cookie'; // If using cookies


export default {
    data() {
        return {
            email: '',
            password: '',
            rememberMe: false,
            errorMessage: '', // For displaying error messages
        };
    },
    methods: {
        async login() {
            this.errorMessage = ''; // Clear previous error messages
            try {
                const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
                await this.retrieveUsername(this.email);
                if (this.rememberMe) {
                    Cookies.set('uid', userCredential.user.uid);
                }
                sessionStorage.setItem('uid', userCredential.user.uid);
                window.location.href = '/';
            } catch (error) {
                // this.errorMessage = error.message || 'Invalid login credentials';
                // Call the method to show the toast notification
                this.showNotification("Invalid Login Credentials", 'alert');
            }
        },
        showNotification(message, type) {
            const notification = {
                type: type,
                message: message,
                timestamp: new Date().toISOString(),
                isVisible: true,
            };
            console.log('Dispatching notification:', notification);
            this.$store.dispatch('addNotification', notification); // Dispatch the action to add notification

        },
        async forgotPassword() {
            if (!this.email) {
                alert('Please enter a valid email address to reset your password.');
                return;
            }

            try {
                await sendPasswordResetEmail(auth, this.email);
                alert('Password reset email has been sent to your inbox.');
            } catch (error) {
                alert(`Error sending reset email: ${error.message}`);
            }
        },
        async retrieveUsername(email) {
            const db = getFirestore();
            const usersRef = collection(db, 'users'); // Replace 'users' with your actual collection name
            const q = query(usersRef, where('email', '==', email));

            try {
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    console.log('No matching documents found.');
                    return;
                }

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const userName = data.name; // Adjust to your actual field name
                    if (this.rememberMe) {
                        Cookies.set('uid', data.id, { expires: 7 }); // Set the username in a cookie
                        Cookies.set('username', userName, { expires: 7 }); // Set the username in a cookie
                        Cookies.set('profilePic', data.imageUrl, { expires: 7 })
                        Cookies.set('userType', data.userType, { expires: 7 })
                    }
                    sessionStorage.setItem('uid', data.id);
                    sessionStorage.setItem('username', userName);
                    sessionStorage.setItem('profilePic', data.imageUrl);
                    sessionStorage.setItem('userType', data.userType);
                });
            } catch (error) {
                console.error('Error retrieving username:', error);
            }
        }
    },
};
</script>
