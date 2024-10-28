<template>
    <header :class="{ 'scrolled-nav': scrolledNav }">
        <nav>
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
                    <router-link class="link" :to="{ name: 'repair' }">Repairers</router-link>
                </li>
                <li v-if="username">
                    <router-link class="link" :to="{ name: 'chat' }">Chat</router-link>
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
            <div v-if="username && !mobile" class="dropdown">
                <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
                    data-bs-toggle="dropdown" aria-expanded="false">{{ username }}
                    <img v-if="profileImage" :src="profileImage" alt="Profile" class="d-inline-block align-text-top"
                        width="30" height="30" />
                    <img v-else :src="profilePic" alt="Profile" class="d-inline-block align-text-top" width="30"
                        height="30" />
                </button>
                <ul class="dropdown-menu dropdown-menu-start" aria-labelledby="dropdownMenuButton">
                    <li>
                        <router-link class="dropdown-item" :to="{ name: 'profile' }">Profile</router-link>
                    </li>
                    <li>
                        <a class="dropdown-item btn" @click="logout">Logout</a>
                    </li>
                </ul>
            </div>
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
                        <router-link class="link" :to="{ name: 'repair' }">Repairers</router-link>
                    </li>
                    <li>
                        <router-link class="link" :to="{ name: 'profile' }">Profile</router-link>
                    </li>
                    <li>
                        <a class="link" @click="logout">Logout</a>
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
                        <router-link class="link" :to="{ name: 'repair' }">Repairers</router-link>
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
            username: '', // Add username data property
            profilePic: defaultProfile, // Update with the actual default profile image path
            profileImage: '', // Add profileImage data property
            scrolledNav: null,
            mobile: null,
            mobileNav: null,
            windowWidth: null,
        }
    },
    created() {
        this.fetchUserData();
        window.addEventListener('resize', this.checkScreen);
        this.checkScreen();
        // Retrieve username from cookies and assign it to the username data property
        this.username = Cookies.get('username') || sessionStorage.getItem('username'); // Assign cookie value or empty string if not found
    },
    mounted() {
        window.addEventListener("scroll", this.updateScroll);

        // Listen for the 'profileUpdated' event
        window.addEventListener('profileUpdated', (event) => {
            this.username = event.detail.username; // Update username in navbar
            if (event.detail.profileImage) {
                console.log('test');
                this.profileImage = event.detail.profileImage; // Update profile image in navbar if available
            } else {
                console.log('test2');
                this.profileImage = this.profilePic; // Fallback to default if no new image
            }
        });
    }
    ,
    methods: {
        async fetchUserData() {
            try {
                const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
                if (uid) {
                    const userRef = await getDoc(doc(db, 'users', uid));
                    if (userRef.exists()) {
                        // If imageUrl is available, set it; otherwise, keep the default image
                        this.profileImage = userRef.data().imageUrl || this.profilePic;
                    }
                }
            } catch (error) {
                console.error('Error fetching user document:', error);
                this.profileImage = this.profilePic; // Fallback in case of an error
            }
        },
        toggleMobileNav() {
            this.mobileNav = !this.mobileNav;
        },
        updateScroll() {
            const scrollPosition = window.scrollY;
            if (scrollPosition > 50) {
                this.scrolledNav = true;
                return
            }
            this.scrolledNav = false;
            return;
        },

        checkScreen() {
            this.windowWidth = window.innerWidth;
            if (this.windowWidth <= 767) {
                this.mobile = true;
                return;
            }
            this.mobile = false;
            this.mobileNav = false;
            return;
        },
        // Define methods for interactivity, e.g., logout function
        logout() {
            const auth = getAuth();

            signOut(auth)
                .then(() => {
                    // Clear the cookies after signing out
                    console.log('user signed out');
                    Cookies.remove('username');
                    Cookies.remove('uid');
                    sessionStorage.removeItem('username');
                    sessionStorage.removeItem('uid');

                    // Redirect to login or homepage
                    window.location.href = '/login';
                })
                .catch((error) => {
                    console.error('Error signing out:', error);
                });
        }
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
</style>