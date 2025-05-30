export function renderLoggedInSideBar(): string {

	return `
		<nav class="flex-col bg-gray-900 max-w-xs">
				<div class="flex items-center justify-between px-6 py-4">
					<a href="/" class="py-1"><img class="h-16" src="/pong-logo-1.svg"></img></a>
					<div class="cursor-pointer md:hidden flex items-center mobile-menu-button">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-12 w-12 text-white">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
						</svg>
					</div>
				</div>
				<div class="hidden flex md:flex flex-col pb-5 px-7 navigation-menu">
					<a data-link href="/dashboard" class="text-xl md:text-base py-2 text-white hover:pl-7 hover:text-gray-400">Dashboard</a>
					<a data-link href="/matchmaking" class="text-xl md:text-base py-2 text-white hover:text-gray-400">Matchmaking</a>
					<a data-link href="/tournament" class="text-xl md:text-base py-2 text-white hover:text-gray-400">Tournament</a>
					<a data-link href="/profile" class="text-xl md:text-base py-2 text-white hover:text-gray-400">Profile</a>
					<a data-link href="/stats" class="text-xl md:text-base py-2 text-white hover:text-gray-400">Stats</a>
				</div>
		</nav>
  `;
}
