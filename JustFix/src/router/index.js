import { createRouter, createWebHistory } from "vue-router";
import Home from '../views/Home.vue';
import Event from '../views/Event.vue'; // Import Event view
import Repair from '../views/Repair.vue'; // Import Repair view
import Login from '../views/Login.vue'; // Import Login view
import Register from '../views/Register.vue'; // Import Register view
import ViewProfile from '../views/ViewProfile.vue'; // Import ViewProfile view
import EditProfile from '../views/EditProfile.vue'; // Import EditProfile view
import Chat from '../views/Chat.vue' //Import Chat view
import { db, auth } from "../main"; // Import Firebase setup
import MyQuotes from "../views/myQuotes.vue";
import PointsDashboard from "../views/PointsDashboard.vue";


const routes = [
    {
        path: '/',
        name: 'home',
        component: Home
    },
    {
        path: '/event',
        name: 'event',
        component: Event
    },
    {
        path: '/repair',
        name: 'repair',
        component: Repair
    },
    {
        path: '/login',
        name: 'login',
        component: Login
    },
    {
        path: '/register',
        name: 'register',
        component: Register
    },
    {
        path: '/profile/:id', // Dynamic route for profile with user ID
        name: 'viewProfile', // Name of the route
        component: ViewProfile,
        props: route => ({ id: route.params.id }) // Pass the route param as a prop
    },
    {
        path: '/editProfile',
        name: 'editProfile',
        component: EditProfile
    },
    {
        path: '/chat',
        name: 'chat',
        component: Chat
    },
    {
        path: '/myQuotes',
        name: 'myQuotes',
        component: MyQuotes
    },
    {
        path: '/points',
        name: 'points',
        component: PointsDashboard
    },


];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (to.hash) {
            return {
                el: to.hash,
                behavior: 'smooth',  // Enable smooth scrolling
            }
        } else if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    },
});

// Route guard to protect profile editing and other authenticated routes
router.beforeEach((to, from, next) => {
    const isAuthenticated = !!auth.currentUser; // Check if the user is logged in

    // Redirect to login page if trying to access editProfile without authentication
    if (to.name === 'editProfile' && !isAuthenticated) {
        next({ name: 'login' });
    } else {
        next(); // Allow route navigation if authenticated or no guard is needed
    }
});

export default router;
