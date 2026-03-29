import { FaWhatsapp, FaInstagram, FaFacebookF } from "react-icons/fa";
import { useGallery } from "../context/GalleryContext";

function SocialIcons() {
	const { contact } = useGallery();
	const socialLinks = [
		{ href: contact?.whatsapp, icon: <FaWhatsapp className="text-white text-3xl" />, label: "WhatsApp" },
		{ href: contact?.instagram, icon: <FaInstagram className="text-white text-3xl" />, label: "Instagram" },
		{ href: contact?.facebook, icon: <FaFacebookF className="text-white text-3xl" />, label: "Facebook" },
	].filter((item) => item.href);

	return (
		<>
			<section className="hidden lg:block fixed w-1/12 inset-y-0 z-30 h-screen">
				<div className="h-full flex flex-col items-center justify-center">
					<div className="w-0.5 h-2/8 bg-white"></div>
					<div className="flex flex-col justify-center gap-4 py-4">
						{socialLinks.map((item) => (
							<a key={item.label} href={item.href} target="_blank" rel="noreferrer" aria-label={item.label}>
								{item.icon}
							</a>
						))}
					</div>
					<div className="w-0.5 h-2/8 bg-white"></div>
				</div>
			</section>
		</>
	);
}

export default SocialIcons
