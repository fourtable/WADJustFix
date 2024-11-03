import { createRouter, createWebHistory } from "vue-router";
import Home from '../views/Home.vue';
import Event from '../views/Event.vue'; // Import Event view
import Repair from '../views/Repair.vue'; // Import Repair view
import Login from '../views/Login.vue'; // Import Login view
import Register from '../views/Register.vue'; // Import Register view
import ViewProfile from '../views/ViewProfile.vue'; // Import ViewProfile view
import EditProfile from '../views/EditProfile.vue'; // Import EditProfile view
import Chat from '../views/Chat.vue' //Import Chat view
import MyQuotes from "../views/myQuotes.vue";
import { db, auth } from "../main"; // Import Firebase setup
import Users from '../views/Users.vue'; // Import Users view

import PointsDashboard from "../views/PointsDashboard.vue"; // Import PointsDashboard view
import Redeem from "../views/Redeem.vue";


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
    {
        path: '/redeem',
        name: 'redeem',
        component: Redeem
    },
    {
        path: '/users',
        name: 'users', // This name should match exactly with the router-link
        component: Users,
        meta: { requiresAdmin: true } // Add this to specify admin-only access
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

// Route guard to protect profile editing and admin-only routes
router.beforeEach((to, from, next) => {
    const isAuthenticated = !!auth.currentUser;
    const isAdmin = auth.currentUser && auth.currentUser.email === "admin@justfix.com"; // Replace with actual admin check

    if (to.meta.requiresAdmin && !isAdmin) {
        // Redirect non-admin users trying to access the Users page
        next({ name: 'home' });
    } else if (to.name === 'editProfile' && !isAuthenticated) {
        // Redirect unauthenticated users trying to edit profile
        next({ name: 'login' });
    } else {
        next(); // Allow route navigation if no guard is triggered
    }
});

export default router;
