export function renderHeroSection(isLoggedIn: boolean): string {
    return `
    <section class="bg-primary-background text-white">
		<div class="container px-5 md:px-10">
			<div class="hero-div flex flex-col md:flex-row justify-around items-center h-screen">
				<div class="hero-div-left w-full md:w-6/12">
					<h3 class="text-2xl text-primary tracking-widest uppercase mb-7">Retropong</h3>
					<h1 class="text-5xl font-roboto mb-4 leading-tight">Old School Fun, New School Challenge</h1>
					<p class="leading-normalfont-roboto text-lg mb-8">The classic Pong game you know and love — now with the power to challenge friends or players from around the world. Paddle up and show them who's boss!</p>
					<div class="flex flex-row gap-2">
						${isLoggedIn
							? `<div>
								<a href="/dashboard/play" data-link class="hidden md:block">
									<button type="button" class="text-base md:text-base text-white bg-primary my-3 py-2 px-5 rounded-md flex items-center whitespace-nowrap hover:text-primary hover:bg-white">
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
											<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
										</svg>
									Play</button>
								</a>
								<a href="/dashboard/settings" data-link class="block md:hidden">
									<button type="button" class="text-base md:text-base text-white bg-primary my-3 py-2 px-5 rounded-md flex items-center whitespace-nowrap hover:text-primary hover:bg-white">
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
											<path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
											<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
										</svg>
									Settings</button>
								</a>
							</div>
							<p class="leading-normalfont-roboto text-lg pt-4">or</p>`
							: ``
						}
						<div>
							<a href="/login" data-link>
								<button type="button" class="text-base md:text-base text-white bg-primary my-3 py-2 px-5 rounded-md flex items-center whitespace-nowrap hover:text-primary hover:bg-white">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
								</svg>
								Log in</button>
							</a>
						</div>
						<div>
						<a href="/register" data-link>
								<button type="button" class="text-base md:text-base text-primary bg-white my-3 py-2 px-5 rounded-md flex items-center whitespace-nowrap hover:text-white hover:bg-primary">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
								Register</button>
							</a>
						</div>
					</div>
				</div>
				<div class="hero-div-right w-full md:w-6/12">
					<img class="w-full hidden md:flex md:pt-5" src="../public/arcade_machine.png"></img>
				</div>
			</div>
		</div>
    </section>
  `;
}
