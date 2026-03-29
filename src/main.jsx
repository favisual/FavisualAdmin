import React from "react"
import ReactDOM from 'react-dom/client'
import {BrowserRouter} from "react-router-dom";
import './index.css'
import App from './App.jsx'
import { GalleryProvider } from "./context/GalleryContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <GalleryProvider>
                <BrowserRouter>
                    <App/>
                </BrowserRouter>
            </GalleryProvider>
        </AuthProvider>
    </React.StrictMode>,
)
