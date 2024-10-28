import { createRouter, createWebHistory} from "vue-router";
import Home from '../views/Home.vue'
import Event from '../views/Event.vue'; // Import Event view
import Repair from '../views/Repair.vue'; // Import Repair view
import Login from '../views/Login.vue'; // Import Login view
import Register from '../views/Register.vue'; // Import Register view
import ViewProfile from '../views/ViewProfile.vue';
import EditProfile from '../views/EditProfile.vue'; // Import EditProfile view
import Chat from '../views/Chat.vue' //Import Chat view
import { db, auth } from "../main"; // Import Firebase setup


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
        path: '/profile/', // Dynamic route for profile with user ID
        name: 'profile', // Use 'profile' as the name (dynamic route name)
        component: ViewProfile,
        props: true // Pass the route param as a prop to the component
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

    
    
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = !!auth.currentUser; // Check if the user is logged in

    if (to.name === 'editProfile' && !isAuthenticated) {
        // Redirect to login page if the user is not authenticated
        next({ name: 'login' });
    } else {
        next(); // Allow route navigation if authenticated or no guard is needed
    }
});

export default router;