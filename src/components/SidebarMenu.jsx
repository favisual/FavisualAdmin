import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TbMenuDeep, TbX } from "react-icons/tb";
import { MdArrowForwardIos } from "react-icons/md";
import { NavLink, useLocation } from "react-router-dom";
import Logo from "../assets/FaVisual.svg";
import { useGallery } from "../context/GalleryContext";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(true);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { categories } = useGallery();
  const menuLinks = [
    { name: "Inicio", href: "/" },
    {
      name: "Categorias",
      submenu: categories.map((category) => ({
        name: category.name,
        href: `/categories/${category.slug}`,
      })),
    },
    { name: "Contacto", href: "/Contact" },
    { name: "Admin", href: "/admin" },
  ];

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const offset = window.scrollY;
          setScrolled(offset > 100);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const menuVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.6,
      },
    },
  };

  const linkVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="relative z-50 lg:hidden">
      {/* Botón de hamburguesa */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="text-3xl p-2 text-gray-800 z-50 relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TbX className={` cursor-pointer ${scrolled ? "text-neutral-900" : "text-white"}`} />
            </motion.div>
          ) : (
            <motion.div
              key="bars"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TbMenuDeep className={`cursor-pointer ${scrolled ? "text-neutral-900" : "text-white"}`} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Menú lateral */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed top-0 left-0 w-72 h-screen bg-white/70 backdrop-blur-lg shadow-2xl p-6 flex flex-col rounded-r-3xl"
          >
            <motion.div
              className="flex flex-col"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={menuVariants}
            >
              <motion.img
                src={Logo}
                alt="Logo"
                className="invert w-32 sm:w-40 mx-auto mb-6"
                variants={linkVariants}
              />

              {menuLinks.map((link, index) => {
                const isActive = location.pathname === link.href;
                return (
                  <motion.div
                    key={index}
                    variants={linkVariants}
                    className={`text-lg font-light uppercase mb-4 ${isActive ? "font-medium text-gray-900" : "text-gray-800"}`}
                  >
                    {link.submenu ? (
                      <>
                        <button
                          onClick={() => setSubmenuOpen((prev) => !prev)}
                          className="flex justify-between items-center w-full uppercase hover:text-gray-800 transition-transform duration-200 hover:translate-x-1"
                        >
                          {link.name}
                          <motion.span
                            animate={{ rotate: submenuOpen ? 90 : 0 }}
                            transition={{ duration: 0.3 }}
                            className="ml-2 text-sm"
                          >
                            <MdArrowForwardIos />
                          </motion.span>
                        </button>
                        <AnimatePresence>
                          {submenuOpen && (
                            <motion.ul
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              variants={{
                                hidden: { opacity: 0, height: 0 },
                                visible: {
                                  opacity: 1,
                                  height: "auto",
                                  transition: {
                                    when: "beforeChildren",
                                    staggerChildren: 0.05,
                                  },
                                },
                              }}
                              className="ml-4 mt-2 space-y-2 text-gray-800 p-2 overflow-hidden"
                            >
                              {link.submenu.map((sub, i) => {
                                const isSubActive = location.pathname === sub.href;
                                return (
                                  <motion.li
                                    key={i}
                                    variants={{
                                      hidden: { opacity: 0, y: 10 },
                                      visible: { opacity: 1, y: 0 },
                                    }}
                                    transition={{ duration: 0.25 }}
                                  >
                                    <NavLink
                                      to={sub.href}
                                      onClick={() => setIsOpen(false)}
                                      className={`border-b text-sm border-neutral-400 px-2 block transition-transform duration-200 hover:translate-x-1 ${isSubActive ? "font-bold" : "hover:text-gray-800"}`}
                                    >
                                      {sub.name}
                                    </NavLink>
                                  </motion.li>
                                );
                              })}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <NavLink
                        to={link.href}
                        onClick={() => setIsOpen(false)}
                        className="block hover:text-neutral-800 transition-transform duration-200 hover:translate-x-1"
                      >
                        {link.name}
                      </NavLink>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
