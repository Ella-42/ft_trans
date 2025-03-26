export function renderNavBar(): string {


	return `
		<nav class="bg-primary-background" >
			<div class="container px-5 md:px-10 md:flex items-center justify-between gap-6">
				<div class="flex items-center justify-between">
					<a href="#home" class="py-1 px-2"><img class="h-24" src="/pong-logo-1.svg"></img></a>
					<div class="md:hidden flex items-center mobile-menu-button">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-12 w-12 text-white">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
						</svg>
					</div>
				</div>
				<div class="hidden flex md:flex md:flex-row flex-col items-center justify-start pb-5 md:space-x-5 pb-3 md:pb-0 navigation-menu">
					<a href="#home" class="text-xl md:text-base py-2 px-3 block text-white hover:text-gray-400">Home</a>
					<a href="#features" class="text-xl md:text-base py-2 px-3 block text-white hover:text-gray-400">Features</a>
					<button type="button" class="text-xl md:text-base text-white bg-primary my-3 py-3 px-6 rounded-md flex items-center whitespace-nowrap hover:text-primary hover:bg-white">
						
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
							</svg>
						Log in</button>
				</div>
			</div>
		</nav>
  `;
}

document.addEventListener("DOMContentLoaded", () => {


	const mobileMenuButton = document.querySelector(".mobile-menu-button");
	const mobileMenu = document.querySelector(".navigation-menu");

	if (mobileMenuButton)
		mobileMenuButton.addEventListener("click", () => {
			if (mobileMenu)
				mobileMenu.classList.toggle("hidden");
		})

})

