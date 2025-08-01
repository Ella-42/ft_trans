export function renderLoggedInSideBar(): string {

	return `
		<nav class="flex-col bg-gray-900 w-56 hidden md:flex">
				<div class="flex items-center justify-between px-6 py-4">
					<a href="/safe"><p class="text-white">RetroPong</p></a>
					<div class="cursor-pointer md:hidden flex items-center mobile-menu-button">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-12 w-12 text-white">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
						</svg>
					</div>
				</div>
				<div class="hidden flex md:flex flex-col pb-5 px-7">
					<a data-link href="/safe/dashboard" class="text-xl md:text-base py-2 text-white pl-3 hover:text-gray-400 sidebar-link">Dashboard</a>
					<a data-link href="/safe/dashboard/play" class="text-xl md:text-base py-2 text-white pl-3 hover:text-gray-400 sidebar-link">Play Now</a>
					<a data-link href="/safe/dashboard/matchmaking" class="text-xl md:text-base py-2 text-white pl-3 hover:text-gray-400 sidebar-link">Matchmaking</a>
					<a data-link href="/safe/dashboard/tournament" class="text-xl md:text-base py-2 text-white pl-3 hover:text-gray-400 sidebar-link">Tournament</a>
					<a data-link href="/safe/dashboard/profile" class="text-xl md:text-base py-2 text-white pl-3 hover:text-gray-400 sidebar-link">Profile</a>
					<a data-link href="/safe/dashboard/stats" class="text-xl md:text-base py-2 text-white pl-3 hover:text-gray-400 sidebar-link">Stats</a>
					<a data-link href="/safe/dashboard/friends" class="text-xl md:text-base py-2 text-white pl-3 hover:text-gray-400 sidebar-link">Friends</a>
				</div>
		</nav>
  `;
}
