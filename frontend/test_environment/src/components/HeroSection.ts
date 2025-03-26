export function renderHeroSection(): string {
    return `
    <section class="bg-primary-background text-white">
		<div class="container px-5 md:px-10">
			<div class="hero-div flex flex-col md:flex-row justify-around items-center h-screen">
				<div class="hero-div-left w-full md:w-6/12">
					<h3 class="text-3xl text-primary tracking-widest uppercase mb-7">Retropong</h3>
					<h1 class="text-7xl font-roboto mb-4 leading-tight">Old School Fun, New School Challenge</h1>
					<p class="leading-loose font-roboto text-lg mb-8">The classic Pong game you know and love — now with the power to challenge friends or players from around the world. Paddle up and show them who's boss!</p>
					<div class="flex flex-row gap-5":>
						<div>
							<button type="button" class="text-xl md:text-base text-white bg-primary my-3 py-3 px-6 rounded-md flex items-center whitespace-nowrap hover:text-primary hover:bg-white">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
							</svg>
							Log in</button>
						</div>
						<div>
							<button type="button" class="text-xl md:text-base text-primary bg-white my-3 py-3 px-6 rounded-md flex items-center whitespace-nowrap hover:text-white hover:bg-primary">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-2">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
							Register</button>
						</div>
					</div>
				</div>
				<div class="hero-div-right w-full md:w-6/12">
					<img class="w-full hidden md:flex md:pt-5" src="/arcade.svg"></img>
				</div>
			</div>
		</div>
    </section>
  `;
}
