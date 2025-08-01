export function renderLoggedInNavBar(user) {
    return `
		<nav class="bg-gray-900 h-20 hidden md:block">
				
			<div class="h-20 flex justify-between items-center">
				<h1 class="text-white font-Roboto text-2xl pl-10" id="dashboard-title">placeholder</h1>
				<div class="flex items-center gap-3 mr-10">
					<h2 class="text-white text-base">${user.nickname}</h2>
					<button class="ml-10 text-base text-white bg-primary my-3 py-2 px-4 rounded-md flex items-center whitespace-nowrap hover:text-primary hover:bg-white" id="logout-btn">Logout</button>
				</div>
			</div>
		</nav>

		<nav class="bg-primary-background md:hidden">
			<div class="container px-5 md:px-10 md:flex items-center justify-between gap-6">
				<div class="flex items-center justify-between">
					<a data-link href="/safe#home" class="py-1 px-2"><p class="text-white">RetroPong</p></a>
					<div class="md:hidden flex items-center mobile-menu-button-logged-in">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-12 w-12 text-white">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
						</svg>
					</div>
				</div>
				<div class="hidden flex md:flex md:flex-row flex-col items-center justify-start pb-5 md:space-x-5 pb-3 md:pb-0 navigation-menu-logged-in">
				<a data-link href="/dashboard" class="text-base py-2 text-white hover:pl-3 hover:text-gray-400">Dashboard</a>
					<a data-link href="/play" class="text-base py-2 text-white hover:pl-3 hover:text-gray-400">Play Now</a>
					<a data-link href="/matchmaking" class="text-base py-2 text-white hover:pl-3 hover:text-gray-400">Matchmaking</a>
					<a data-link href="/tournament" class="text-base py-2 text-white hover:pl-3 hover:text-gray-400">Tournament</a>
					<a data-link href="/profile" class="text-base py-2 text-white hover:pl-3 hover:text-gray-400">Profile</a>
					<a data-link href="/stats" class="text-base py-2 text-white hover:pl-3 hover:text-gray-400">Stats</a>
				</div>
			</div>
		</nav>
  `;
}
