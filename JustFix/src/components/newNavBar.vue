<template>
    <header :class="{ 'scrolled-nav': scrolledNav }">
        <nav class="sticky-navbar">
            <div class="branding">
                <img src="../assets/newlogo.png" alt="JusFix Logo" width="120" height="60"
                    class="d-inline-block align-text-top" />
            </div>
            <ul v-show="!mobile" class="navigation">
                <li>
                    <router-link class="link" :to="{ name: 'home' }">Home</router-link>
                </li>
                <li>
                    <router-link class="link" :to="{ name: 'event' }">Event</router-link>
                </li>
                <li>
                    <router-link class="link" :to="{ name: 'home', hash: '#fixer' }">Fixers</router-link>
                </li>
                <li v-if="username">
                    <router-link class="link" :to="{ name: 'chat' }">Chat</router-link>
                </li>
                <li v-if="type === 'admin'">
                    <router-link class="link" :to="{ name: 'users' }">Users</router-link>
                </li>
                <li v-if="type === 'admin'">
                    <router-link class="link" :to="{ name: 'approveEvent' }">Approval</router-link>
                </li>
            </ul>
            <ul v-if="!username && !mobile" class="navigation auth-buttons">
                <li>
                    <router-link :to="{ name: 'login' }" class="btn-login btn btn-dark d-md-inline d-none"
                        role="button">Login</router-link>
                </li>
                <li>
                    <router-link :to="{ name: 'register' }" class="btn-register btn btn-dark d-md-inline d-none"
                        role="button">Register</router-link>
                </li>
            </ul>
            <div v-if="username && !mobile" class="dropdown" ref="dropdownContainer">
                <button class="btn btn-secondary dropdown-toggle" type="button" @click="toggleDropdown">
                    {{ username }}
                    <img v-if="localProfileImage" :src="localProfileImage" alt="Profile"
                        class="d-inline-block align-text-top" width="30" height="30" />
                    <img v-else :src="profilePic" alt="Profile" class="d-inline-block align-text-top" width="30"
                        height="30" />
                </button>
                <ul class="dropdown-menu" :class="{ show: dropdownVisible }" aria-labelledby="dropdownMenuButton">
                    <li v-if="uid">
                        <router-link class="dropdown-item"
                            :to="{ name: 'viewProfile', params: { id: uid } }">Profile</router-link>
                    </li>
                    <li v-if="type === 'admin'"><router-link class="dropdown-item" :to="{ name: 'myQuotes' }">Quotes
                            List</router-link></li>
                    <li v-else><router-link class="dropdown-item" :to="{ name: 'myQuotes' }">My Quotes</router-link>
                    </li>
                    <li v-if="type !== 'admin'">
                        <router-link class="dropdown-item" :to="{ name: 'points' }">My Points</router-link>
                    </li>
                    <li>
                        <a class="dropdown-item btn" @click="logout">Logout</a>
                    </li>
                </ul>
            </div>
            <div v-if="type == 'repairer' && !mobile"
                class="fixer-container animate__animated animate__fadeIn animate__delay-1s">
                <div class="fixer-text">Fixer</div>
                <i class="fas fa-wrench fixer-icon"></i>
            </div>
            <div v-if="type == 'user' && !mobile"
                class="customer-icon-container animate__animated animate__fadeIn animate__delay-1s">
                <p class="customer-text animate__animated animate__fadeInUp">Customer</p>
                <i class="fa fa-user customer-icon animate__animated animate__bounce"></i>
            </div>
            <div v-if="type == 'admin'" style="margin-right: 5%;"></div>
            <div class="icon">
                <i @click="toggleMobileNav" v-show="mobile" class="fa fa-bars"
                    :class="{ 'icon-active': mobileNav }"></i>
            </div>
            <transition v-if="username" name="mobile-nav">
                <ul v-show="mobileNav" class="dropdown-nav">
                    <li>
                        <router-link class="link" :to="{ name: 'home' }">Home</router-link>
                    </li>
                    <li>
                        <router-link class="link" :to="{ name: 'event' }">Event</router-link>
                    </li>
                    <li>
                        <router-link class="link" :to="{ name: 'home', hash: '#fixer' }">Fixers</router-link>
                    </li>
                    <li v-if="username">
                        <router-link class="link" :to="{ name: 'chat' }">Chat</router-link>
                    </li>
                    <li v-if="type === 'admin'">
                        <router-link class="link" :to="{ name: 'users' }">Users</router-link>
                    </li>
                    <li v-if="type === 'admin'">
                        <router-link class="link" :to="{ name: 'approveEvent' }">Approval</router-link>
                    </li>
                    <li v-if="uid">
                        <router-link class="link"
                            :to="{ name: 'viewProfile', params: { id: uid } }">Profile</router-link>
                    </li>
                    <li>
                        <router-link class="link" :to="{ name: 'myQuotes' }">My Quotes</router-link>
                    </li>
                    <li v-if="uid">
                        <router-link class="link" :to="{ name: 'points' }">My Points</router-link>
                    </li>
                    <li>
                        <router-link class="link" :to="{ name: 'login' }" @click="logout">Logout</router-link>
                        <!-- <a class="link" @click="logout">Logout</a> -->
                    </li>
                </ul>
            </transition>
            <transition v-else name="mobile-nav">
                <ul v-show="mobileNav" class="dropdown-nav">
                    <li>
                        <router-link class="link" :to="{ name: 'home' }">Home</router-link>
                    </li>
                    <li>
                        <router-link class="link" :to="{ name: 'event' }">Event</router-link>
                    </li>
                    <li>
                        <router-link class="link" :to="{ name: 'home', hash: '#fixer' }">Fixers</router-link>
                    </li>
                    <li>
                        <router-link class="link" :to="{ name: 'login' }">Login</router-link>
                    </li>
                    <li>
                        <router-link class="link" :to="{ name: 'register' }">Register</router-link>
                    </li>
                </ul>
            </transition>
        </nav>
    </header>
</template>

<script>
import Cookies from 'js-cookie'
import defaultProfile from '../assets/person.svg'
import { getAuth, signOut } from "firebase/auth";
import { db } from '../main';
import { doc, getDoc } from 'firebase/firestore';

export default {
    props: {
        profileImage: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            username: '', // Store username
            profilePic: defaultProfile, // Default profile image
            uid: '', // Store user ID
            type: '',
            localProfileImage: '', // Profile image after fetching from database
            scrolledNav: null,
            mobile: null,
            mobileNav: null,
            windowWidth: null,
            dropdownVisible: false,
        }
    },
    created() {
        window.addEventListener('resize', this.checkScreen);
        this.checkScreen();
        // Retrieve username from cookies or sessionStorage
        this.uid = Cookies.get('uid') || sessionStorage.getItem('uid');
        this.username = Cookies.get('username') || sessionStorage.getItem('username');
        this.localProfileImage = Cookies.get('profilePic') || sessionStorage.getItem('profilePic');
        this.type = Cookies.get('userType') || sessionStorage.getItem('userType');
        this.fetchUserData(this.uid);
    },
    mounted() {
        this.localProfileImage = this.profileImage; // Initialize localProfileImage
        this.uid = Cookies.get('uid') || sessionStorage.getItem('uid'); // Fetch uid from cookies or sessionStorage
        this.username = Cookies.get('username') || sessionStorage.getItem('username');
        this.profilePic = Cookies.get('profilePic') || sessionStorage.getItem('profilePic');
        this.type = Cookies.get('userType') || sessionStorage.getItem('userType');
        if (!this.uid) {
            console.error("UID is not available");
        }
        window.addEventListener("scroll", this.updateScroll);

        // Listen for 'profileUpdated' event
        window.addEventListener('profileUpdated', (event) => {
            this.username = event.detail.username;
            this.localProfileImage = event.detail.profileImage || this.profilePic;
        });
    },
    methods: {
        async fetchUserData(uid) {
            try {
                if (uid) {
                    const userRef = await getDoc(doc(db, 'users', uid));
                    if (userRef.exists()) {
                        this.localProfileImage = userRef.data().imageUrl || this.profilePic;
                        this.type = userRef.data().userType;
                    }
                } else {
                    console.error("No UID available");
                }
            } catch (error) {
                console.error('Error fetching user document:', error);
                this.localProfileImage = this.profilePic; // Fallback in case of an error
            }
        },
        toggleDropdown() {
            this.dropdownVisible = !this.dropdownVisible;
        },
        closeDropdown(event) {
            // Check if the click happened outside the dropdown container
            if (!this.$refs.dropdownContainer.contains(event.target)) {
                this.dropdownVisible = false;
            }
        },
        toggleMobileNav() {
            this.mobileNav = !this.mobileNav;
        },
        updateScroll() {
            this.scrolledNav = window.scrollY > 50;
        },
        checkScreen() {
            this.windowWidth = window.innerWidth;
            console.log(this.type);
            if (this.type == 'admin') {
                if (this.windowWidth <= 834) {
                    this.mobile = true;
                } 
                else {
                    this.mobile = false;
                    this.mobileNav = false;
                }
            }
            else {
                if (this.windowWidth <= 767) {
                    this.mobile = true;
                } 
                else {
                    this.mobile = false;
                    this.mobileNav = false;
                }
            }

        },
        logout() {
            const auth = getAuth();
            signOut(auth)
                .then(() => {
                    this.uid = '';
                    this.username = '';
                    this.type = '';
                    this.profilePic = '';
                    // Clear cookies after signout
                    Cookies.remove('username');
                    Cookies.remove('uid');
                    Cookies.remove('profilePic');
                    Cookies.remove('userType');
                    sessionStorage.removeItem('username');
                    sessionStorage.removeItem('uid');
                    sessionStorage.removeItem('profilePic');
                    sessionStorage.removeItem('userType');
                    localStorage.removeItem('selectedRepairmen'); // Clear the selected repairmen from localStorage

                    // Redirect to login page
                    // window.location.href = '/login';
                    this.$router.push('/login');
                })
                .catch((error) => {
                    console.error('Error signing out:', error);
                });
        }
    },
    mounted() {
        document.addEventListener("click", this.closeDropdown);
    },
    beforeDestroy() {
        document.removeEventListener("click", this.closeDropdown);
    },
}
</script>


<style lang="scss" scoped>
header {
    background-color: #ffffff;
    z-index: 99;
    width: 100vw;
    position: fixed;
    transition: .5s ease all;
    color: #000;
    margin-bottom: 100px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);

    nav {
        display: flex;
        flex-direction: row;
        padding: 12px;
        transition: .5s ease all;
        width: 100%;
        margin: 0 auto;
        align-items: center;


        ul,
        .link {
            font-weight: 500;
            list-style: none;
            text-decoration: none;
            color: #000;
        }

        li {
            text-transform: uppercase;
            margin-left: 16px;
        }

        .link {
            padding: 16px;
            font-size: 14px;
            transition: .5s ease all;
            padding-bottom: 4px;
            border-bottom: 1px solid transparent;

            &:hover {
                color: #00afea;
                border-color: #00afea;
            }
        }

        .branding {
            display: flex;
            gap: 30px;

        }

        .navigation {
            margin: auto;
            display: flex;
            align-items: end;
            flex: 0;
            justify-content: end;
            padding-left: 1px;
        }

        .fixer-container {
            display: flex; // Ensure it's displayed as flex
            font-weight: bold;
            align-items: center; // Center items vertically
            margin-left: 1%; // Add a small margin to space it from the dropdown
            margin-right: 1%;
            // Adjust any other styles as needed
        }

        .fixer-icon {
            font-size: 1.5rem;
            /* Adjust icon size */
            color: #085C44;
            /* Bootstrap primary color */
            margin-right: 10px;
            /* Spacing between icon and text */
            transition: transform 0.3s ease;
            /* Smooth transition for icon hover */
        }

        .fixer-text {
            font-size: 2rem;
            color: #cdf696;
            /* Bootstrap primary color */
            transition: transform 0.3s ease, color 0.3s ease;
            /* Smooth transition for text hover */
        }

        .fixer-container:hover .fixer-icon {
            transform: rotate(15deg);
            /* Rotate icon on hover */
        }

        .fixer-container:hover .fixer-text {
            transform: scale(1.1);
            /* Scale up text on hover */
            color: #085C44;
            /* Darker shade on hover */
            animation: shake 0.5s;
            /* Shake effect on hover */
        }

        @keyframes shake {

            0%,
            100% {
                transform: translateX(0);
            }

            25% {
                transform: translateX(-5px);
            }

            50% {
                transform: translateX(5px);
            }

            75% {
                transform: translateX(-5px);
            }
        }

        .customer-icon-container {
            display: flex;
            align-items: center;
            margin: 0 3% 0 1%;
            /* Adjust the gap between icon and text */
            cursor: pointer;
            /* Make it look clickable */
            transition: transform 0.3s ease;
            /* Smooth transition for hover effect */
        }

        .customer-icon {
            font-size: 1.5rem;
            /* Adjust size as needed */
            color: #2f855a;
            /* Customize color */
            transition: color 0.3s ease, transform 0.3s ease;
            /* Smooth transition for color and scale on hover */
        }

        .customer-text {
            font-size: 1.5rem;
            /* Customize as desired */
            font-weight: bold;
            color: #2f855a;
            margin: 0;
            transition: color 0.3s ease, transform 0.3s ease;
            /* Smooth transition for color and scale on hover */
        }

        /* Infinite pulse animation on icon */
        .animate__pulse.animate__infinite {
            animation-iteration-count: infinite;
        }

        /* Hover effects */
        .customer-icon-container:hover .customer-icon {
            color: #38a169;
            /* Change color on hover */
            transform: scale(1.2);
            /* Slightly enlarge the icon */
        }

        .customer-icon-container:hover .customer-text {
            color: #38a169;
            /* Change color on hover */
            transform: scale(1.1);
            /* Slightly enlarge the text */
        }

        .auth-buttons {
            display: flex;
            margin: 0;
            margin-left: 0;
            margin-right: 5%;

            .btn-login,
            .btn-register {
                padding: 8px 15px;
                border-radius: 5px;
                font-weight: 600;
                text-transform: uppercase;
                border: 1px solid #085C44;
                transition: .3s;
            }

            .btn-login {
                background-color: #ffffff;
                color: #085C44;

                &:hover {
                    background-color: #085C44;
                    color: #ffffff;
                }
            }

            .btn-register {
                background-color: #ffffff;
                color: #085C44;

                &:hover {
                    background-color: #085C44;
                    color: #ffffff;
                }
            }
        }

        .icon {
            display: flex;
            align-items: center;
            position: absolute;
            top: 0;
            right: 24px;
            height: 100%;

            i {
                cursor: pointer;
                font-size: 24px;
                transition: .8s ease all;
                color: #085C44;
                border-radius: 10px solid grey;
            }
        }

        .icon-active {
            transform: rotate(180deg);
        }

        .dropdown-menu {
            min-width: 0;
            /* Allow the dropdown to shrink */
            width: 100%;
            /* Let the dropdown adjust its width based on the content */
        }

        .dropdown-toggle {
            display: flex;
            /* Use flexbox for layout */
            justify-content: space-evenly;
            /* Space items evenly */
            align-items: center;
            /* Center items vertically */
            width: 100%;
            /* Ensure the button takes full width */
            padding: 0.5rem 1rem;
            /* Add padding for better appearance */
        }

        .dropdown {
            display: inline-block;
            /* Ensure the dropdown aligns properly */
            margin: 0;
            max-width: fit-content;
        }

        .dropdown-nav {
            display: flex;
            flex-direction: column;
            position: fixed;
            width: 100%;
            max-width: 250px;
            height: 100%;
            background: #ffffff;
            top: 0;
            left: 0;

            li {
                margin: 5% 0 5% 0;

                .link {
                    color: #000;
                }
            }
        }

        .mobile-nav-enter-active,
        .mobile-nav-leave-active {
            transition: 1s ease all;
            /* Smooth transition effect */
        }

        .mobile-nav-enter-from,
        .mobile-nav-leave-to {
            transform: translateX(-250px);
            /* Start hidden to the left */
        }

        .mobile-nav-enter-to {
            transform: translateX(0);
            /* Slide in to be visible */
        }

    }
}

.scrolled-nav {
    background-color: #ffffff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba (0, 0, 0, 0.06);

    nav {
        padding: 8px 0;

        .branding {
            img {
                width: 80px;
                height: 40px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba (0, 0, 0, 0.06);
            }
        }
    }
}

.sticky-navbar {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: white;
    width: 100%;
}
</style>