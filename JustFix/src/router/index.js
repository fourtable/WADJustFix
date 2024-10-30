import { createRouter, createWebHistory} from "vue-router";
import Home from '../views/Home.vue'
import Event from '../views/Event.vue'; // Import Event view
import Repair from '../views/Repair.vue'; // Import Repair view
import Login from '../views/Login.vue'; // Import Login view
import Register from '../views/Register.vue'; // Import Register view
import Profile from '../views/ViewProfile.vue'; // Import Profile view
import EditProfile from '../views/EditProfile.vue'; // Import EditProfile view
import Chat from '../views/Chat.vue' //Import Chat view
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
        path: '/profile',
        name: 'profile',
        component: Profile
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
        path: '/points',
        name: 'points',
        component: PointsDashboard
      },  
    
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;