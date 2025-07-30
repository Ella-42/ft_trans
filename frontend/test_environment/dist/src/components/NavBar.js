export function renderNavBar(isLoggedIn) {
    const navbarHTML = `
		<nav class="bg-primary-background" >
			<div class="container px-5 md:px-10 md:flex items-center justify-between gap-6">
				<div class="flex items-center justify-between">
					<a data-link href="/safe#home" class="py-1 px-2"><img class="h-20" src="../safe/public/pong-logo-png.png"></img></a>
					<div class="md:hidden flex items-center mobile-menu-button">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-12 w-12 text-white">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
						</svg>
					</div>
				</div>
				<div class="hidden flex md:flex md:flex-row flex-col items-center justify-start pb-5 md:space-x-5 pb-3 md:pb-0 navigation-menu">
					<a data-link href="/safe#home" class="text-base md:text-base py-1 px-3 block text-white hover:text-gray-400">Home</a>
					<a data-link href="/safe#features" class="text-base md:text-base py-1 px-3 block text-white hover:text-gray-400">Features</a>
					${isLoggedIn ? `<a data-link href="/safe/dashboard" class="text-base md:text-base py-1 px-3 block text-white hover:text-gray-400">Dashboard</a>` : ``}
					${isLoggedIn
        ? ``
        : `<a data-link href="/safe/login"><button class="text-white bg-primary px-4 py-2 rounded hover:bg-white hover:text-primary">Log in</button></a>`}
				</div>
			</div>
		</nav>
  	`;
    return navbarHTML;
}
