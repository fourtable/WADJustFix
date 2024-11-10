<style lang="css">
@import '../../src/styles.css';
</style>

<template>
    <div class="full-height">
        <!-- Left Section with Background -->
        <div class="left-section">
            <div class="left-section m-0">
                <img src="../assets/aircon-servicing-home.png" alt="image of aircon servicing"
                    class="full-height-image">
            </div>
        </div>
        <!-- Right Section with the login form -->
        <div class="right-section">
            <div class="card login-right-card">
                <!-- <button class="btn google-btn d-flex align-items-center mx-auto" id="googleSignInBtn"
                    style="padding: 8px 12px;">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo"
                        width="20">
                    Sign in with Google
                </button>
                <hr class="solid"> -->
                <div class="card-divider">
                    <h4 style="font-weight:bold; font-size:xx-large;">Login</h4>
                </div>
                <div class="card-section">

                    <form id="loginForm" @submit.prevent="login" required>
                        <div class="form-group mb-2">
                            <!-- <label for="email">Email</label> -->
                            <input v-model="email" type="email" id="email" class="form-control p-3"
                                placeholder="Email Address" required>
                        </div>

                        <div class="form-group mb-2">
                            <!-- <label for="password">Password</label> -->
                            <input v-model="password" type="password" id="password" class="form-control p-3"
                                placeholder="Password" required>
                        </div>

                        <!-- Only for the "Remember me" checkbox -->
                        <div class="form-group mb-2 d-flex justify-content-between">
                            <div class="form-check d-inline-flex align-items-center">
                                <input v-model="rememberMe" type="checkbox" id="rememberMe"
                                    class="form-check-input me-2">
                                <label for="rememberMe" class="form-check-label mb-0"
                                    style="padding-top: 5px; font-weight:350; font-size: small;">Remember
                                    me</label>
                            </div>
                            <a href="#" id="forgotPassword" class="ms-auto d-inline-flex align-items-center"
                                style="text-decoration: none; color: black; padding-top: 5px; font-size: smaller; padding-right:10px; font-weight:350;">Forgot
                                Password?</a>
                        </div>
                        <br>
                        <button type="submit" class="button hero-button pt-3 pt-3"
                            :class="{ 'hero-button': true, 'invalid-button': !isFormValid }">Login</button>
                    </form>


                    <div style="text-align: center; padding-top: 10px;">
                        <span>Don't have an account? <router-link :to="{ name: 'register' }"
                                style="text-decoration: none; color: black; font-weight: bolder;"
                                class="register">Register</router-link></span>
                    </div>
                    <p v-if="errorMessage" id="errorMessage" style="color: red;">{{ errorMessage }}</p>
                </div>
            </div>


        </div>
    </div>


</template>
<script>
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../main'; // Adjust the import to your Firebase configuration
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'; // Ensure proper Firestore import
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
                const user = userCredential.user;
                // Update the lastLogin field in Firestore
                await this.updateLastLogin(user.uid);
                await this.updateStatus(user.uid, "Active"); // Optionally set status to "Active"
                await this.retrieveUsername(this.email);
                if (this.rememberMe) {
                    Cookies.set('uid', userCredential.user.uid, { expires: 7 });
                }
                sessionStorage.setItem('uid', userCredential.user.uid);
                window.location.href = '/';
                // Check if there's a stored intended path
                const intendedPath = sessionStorage.getItem('intendedPath');
                if (intendedPath) {
                    sessionStorage.removeItem('intendedPath'); // Clear the stored path
                    this.$router.push(intendedPath);
                } else {
                    this.$router.push('/');
                }
            } catch (error) {
                // this.errorMessage = error.message || 'Invalid login credentials';
                // Call the method to show the toast notification
                this.showNotification("Invalid Login Credentials", 'alert');
            }
        },
        async updateLastLogin(uid) {
            try {
                const userDoc = doc(db, "users", uid);
                await updateDoc(userDoc, {
                    lastLogin: new Date() // Set lastLogin to the current date and time
                });
            } catch (error) {
                console.error("Error updating lastLogin:", error);
            }
        },
        async updateStatus(uid, status) {
            try {
                const userDoc = doc(db, "users", uid);
                await updateDoc(userDoc, {
                    status: status
                });
            } catch (error) {
                console.error("Error updating status:", error);
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
                    console.log(data);
                    if (this.rememberMe) {
                        Cookies.set('username', userName, { expires: 7 }); // Set the username in a cookie
                        Cookies.set('profilePic', data.imageUrl, { expires: 7 })
                        Cookies.set('userType', data.userType, { expires: 7 })
                    }
                    sessionStorage.setItem('username', userName);
                    sessionStorage.setItem('profilePic', data.imageUrl);
                    sessionStorage.setItem('userType', data.userType);
                });
            } catch (error) {
                console.error('Error retrieving username:', error);
            }
        }
    },
    beforeRouteLeave(to, from, next) {
    document.body.style.overflow = 'auto'; // Ensure scrolling is enabled when leaving login page
    next();
    }
};
</script>


<style scoped>
.full-height {
    height: 97vh;
    display: flex;
    overflow: hidden;
    width: 100vw;
}

.left-section,
.right-section {
    height: 100%;
}

.left-section {
    width: 50%;
    /* Left section takes 50% width */
}

.right-section {
    width: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
}

@media (max-width: 1000px) {
    .full-height {

        .right-section,
        .register-section {
            flex: 1;
        }
    }
}

.login-right-card {
    width: 500px;
    border: 0px;
    /* Adjust the card width as needed */
}

/* Hide scrollbar for the entire page */
body {
    overflow: hidden;
    /* Prevent any overflow */
}

/* Hide scrollbar even when content overflows */
::-webkit-scrollbar {
    display: none;
    /* Hide scrollbars */
}

.full-height-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.hero-button:hover {
    background-color: #085C44;
    color: #ffffff;
}
</style>