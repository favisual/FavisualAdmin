function Footer() {
	return (
		<footer className="bg-neutral-900 text-white py-8">
			<div className="max-w-7xl mx-auto px-4">
				<div className="flex flex-col items-center">
					<img src="/FaVisual.svg" alt="FaVisual Logo" className="h-12 mb-4" />
					<p className="text-sm text-neutral-500">© 2025 FaVisual. All rights reserved.</p>
					<a href="/admin" className="mt-3 text-xs uppercase tracking-[0.3em] text-neutral-400 hover:text-white transition-colors">
						Admin
					</a>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
