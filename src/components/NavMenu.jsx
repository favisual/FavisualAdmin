import { NavLink } from 'react-router-dom';
import { useState, useEffect } from "react";
import SidebarMenu from "./SidebarMenu.jsx";
import { useGallery } from "../context/GalleryContext";

export default function NavMenu() {
    const [submenuOpen, setSubmenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { categories } = useGallery();

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const offset = window.scrollY;
                    setScrolled((prev) => {
                        const next = offset > 100;
                        return prev !== next ? next : prev;
                    });
                    ticking = false;
                });
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        }
    }, []);

    return (

        <>
            <section className={`w-full flex justify-between px-8 items-center sticky top-0 transition-all duration-300 ${scrolled ? "bg-white py-2 shadow-lg" : "bg-transparent py-6"} z-50 `}>
                <NavLink to="/">
                    <img className={`transition-all duration-300 ${scrolled ? "w-20 invert" : "w-36"}`} src="/FaVisual.svg"
                        alt="" />
                </NavLink>
                <nav className="hidden lg:flex">
                    <ul className={`flex space-x-6 transition-all duration-300 ${scrolled ? "text-neutral-900" : "text-white"}`}>
                        <li>
                            <NavLink to="/" className="py-6 px-2">Inicio</NavLink>
                        </li>
                        <li className="relative block" onMouseEnter={() => setSubmenuOpen(true)}
                            onMouseLeave={() => setSubmenuOpen(false)}>
                            <span className="cursor-pointer py-6 px-2">Categorías</span>
                            <ul className={`absolute bg-white shadow-lg mt-5 p-6 space-y-4 rounded-lg transition-all duration-300 origin-top transform text-neutral-900 ${submenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                                {categories.map((category) => (
                                    <li key={category.id}>
                                        <NavLink to={`/categories/${category.slug}`} className="block">
                                            {category.name}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </li>
                        <li><NavLink to="/Contact" className="py-6 px-2">Contacto</NavLink></li>
                        <li><NavLink to="/admin" className="py-6 px-2">Admin</NavLink></li>
                    </ul>
                </nav>
                <SidebarMenu />
            </section>
        </>

    )
}
