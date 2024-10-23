import { createRouter, createWebHistory} from "vue-router";
import Home from '../views/Home.vue'
import Event from '../views/Event.vue'; // Import Event component
import Repair from '../views/Repair.vue'; // Import Repair component
import Login from '../views/Login.vue'; // Import Login component
import Register from '../views/Register.vue'; // Import Register component
import Profile from '../views/ViewProfile.vue'; // Import Profile component
import EditProfile from '../views/EditProfile.vue'; // Import EditProfile component

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
        path: '/profile',
        name: 'profile',
        component: Profile
    },
    {
        path: '/editProfile',
        name: 'editProfile',
        component: EditProfile
    },
    
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;