import { createBrowserRouter } from 'react-router-dom'
import Layout from './Layout'
import Home from './pages/Home'
import Product from './pages/product'
import Carts from './pages/carts'
import Admin from './pages/admin'
import Register from './pages/register'
import Login from './pages/login'
import Profile from './pages/profile'
import Favorites from './pages/favorites'

export const myrouter = createBrowserRouter([
    {
        path: '/' ,
        element: <Layout/>,
        children:[
            {
                path:'/',
                element: <Home/>
            },
            {
                path: '/product',
                element: <Product/>
            },
            {
                path: '/carts',
                element: <Carts/>
            },
            {
                path: '/admin',
                element: <Admin/>
            },
            {
                path: '/register',
                element: <Register/>
            },
            {
                path: '/login',
                element: <Login/>
            },
            {
                path: '/profile',
                element: <Profile/>
            }, 
            {
                path: '/favorites',
                element: <Favorites/>
            }
        ]
    }
])