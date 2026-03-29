import './App.css'
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Home from './pages/Home';
import Categories from "./pages/Categories";
import Contact from "./pages/Contact";
import CategoryGallery from "./pages/CategoryGallery";
import NavMenu from "./components/NavMenu";
import SocialIcons from './components/SocialIcons';
import Footer from "./components/Footer";
import AdminPage from "./pages/AdminPage";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    const location = useLocation();

    return (
        <section className="bg-neutral-900">
            <>
                <NavMenu />
                <SocialIcons />
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route
                            path="/"
                            element={
                                <PageTransition>
                                    <Home />
                                </PageTransition>
                            }
                        />
                        <Route
                            path="/categories"
                            element={
                                <PageTransition>
                                    <Categories />
                                </PageTransition>
                            }
                        >
                            <Route
                                path=":categorySlug"
                                element={
                                    <PageTransition>
                                        <CategoryGallery />
                                    </PageTransition>
                                }
                            />
                        </Route>
                        <Route
                            path="/Contact"
                            element={
                                <PageTransition>
                                    <Contact />
                                </PageTransition>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute>
                                    <AdminPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/login"
                            element={
                                <Login />
                            }
                        />
                    </Routes>
                </AnimatePresence>
                <Footer />
            </>
        </section>
    );
}

function PageTransition({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
        >
            {children}
        </motion.div>
    );
}

export default App;
