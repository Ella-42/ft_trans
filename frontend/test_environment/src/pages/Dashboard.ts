import { renderLoggedInSideBar } from '../components/LoggedInSideBar.js'
import { renderFooter } from '../components/Footer.js'
import { renderLoggedInNavBar } from '../components/LoggedInNavBar.js';
//import { renderFriends } from '../components/Friends';
//import { renderRecentMatches } from '../components/RecentMatches';

const date = new Date().toLocaleDateString('en-us', {weekday: "long", month: "short", day: "numeric"});

export const renderDashboard = (): string => {
	return `
	<section class="flex">
		${renderLoggedInSideBar()}
		<section class="flex flex-col w-full">
			${renderLoggedInNavBar()}
			<section class="bg-primary-background text-white">
				<div class="container px-5 flex flex-col">
					<div class="px-10 py-5 rounded-xl my-5 bg-gray-900 flex justify-between items-center">
						<p class="font-extralight text-xl">Hi, pclaus 👋</p>
						<p class="font-extralight">${date}</p>
					</div>
					<div>
						<div class="flex flex-row gap-6">
							<div class="w-1/4 px-10 py-5 rounded-xl bg-gray-900 mb-5">
								<div class="flex items-center gap-1">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
									<path stroke-line="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/></svg>
									<h2 class="text-2xl">Matchmaking</h2>
								</div>
								<p class="font-thin mt-2">Join matchmaking to be paired up with a random player.</p>
							</div>
							<div class="w-1/4 px-10 py-5 rounded-xl bg-gray-900 mb-5">
								<div class="flex items-center gap-1">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" /></svg>
									<h2 class="text-2xl">Tournament</h2>
								</div>
								<p class="font-thin mt-2">Join a tournament and battle against increasingly difficult opponents.</p>
							</div>
							<div class="w-1/4 px-10 py-5 rounded-xl bg-gray-900 mb-5">
								<div class="flex items-center gap-1">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
									<h2 class="text-2xl">Profile</h2>
								</div>
								<p class="font-thin mt-2">View and edit your profile and change your profile picture.</p>
							</div>
							<div class="w-1/4 px-10 py-5 rounded-xl bg-gray-900 mb-5">
								<div class="flex items-center gap-1">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
									<h2 class="text-2xl">Stats</h2>
								</div>
								<p class="font-thin mt-2">View your stats and see how many wins and losses you have.</p>
							</div>
						</div>
					</div>
						<div class="flex flex-row gap-6">
							<div class="w-1/2 px-10 py-5 rounded-xl bg-gray-900 mb-10">
								<div class="flex items-center gap-1">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
									<h2 class="text-2xl">Match history</h2>
								</div>
								<p class="font-thin mt-2">View your match history.</p>
								<div class="pt-4">
								</div>
							</div>
							<div class="w-1/2 px-10 py-5 rounded-xl bg-gray-900 mb-10">
								<div class="flex items-center gap-1">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>
									<h2 class="text-2xl">Friends list</h2>
								</div>
								<p class="font-thin mt-2">View and manage friends.</p>
								<div class="pt-4">
								</div>
							</div>
						</div>
				</div>
			</section>
		</section>
	</section>
	${renderFooter()}  `;
}

