export function renderFeaturesSection(): string {
    return `
    <section class="bg-hero-pattern bg-cover bg-top pb-28 w-full text-white" id="features">
		<div class="container px-5 md:px-10">
			<div class="features-div flex flex-col items-center">
				<h2 class="font-Roboto text-4xl pt-24 pb-16">Features</h2>
				<div class="flex flex-col md:flex-row gap-6 ">
					<div class="flex flex-col bg-primary-background rounded-xl py-10 px-6 items-center">
						<img class="h-14 w-14" src="/tournament.png"></img>
						<h4 class="font-Roboto text-xl font-semibold mt-4 text-center">Tournament</h4>
						<p class="font-light text-base font-Roboto mt-1 text-center leading-loose">Compete for glory in thrilling tournaments. Rise through the brackets and claim your spot at the top!</p>
					</div>	
					<div class="flex flex-col bg-primary-background rounded-xl py-10 px-6 items-center">
						<img class="h-14 w-14" src="/matchmaking.png"></img>
						<h4 class="font-Roboto text-xl font-semibold mt-4 text-center">Matchmaking</h4>
						<p class="font-light text-base font-Roboto mt-1 text-center leading-loose">Jump straight into action with our smart matchmaking system, so you never have to wait long to play a game!</p>
					</div>	
					<div class="flex flex-col bg-primary-background rounded-xl py-10 px-6 items-center">
						<img class="h-14 w-14" src="/remote.png"></img>
						<h4 class="font-Roboto text-xl font-semibold mt-4 text-center">Remote players</h4>
						<p class="font-light text-base font-Roboto mt-1 text-center leading-loose">Play against friends or challengers from anywhere in the world. Distance is no match for your paddle skills!</p>
					</div>	
					<div class="flex flex-col bg-primary-background rounded-xl py-10 px-6 items-center">
						<img class="h-14 w-14" src="/stats.png"></img>
						<h4 class="font-Roboto text-xl font-semibold mt-4 text-center">Game stats</h4>
						<p class="font-light text-base font-Roboto mt-1 text-center leading-loose">Track your performance with detailed stats, from win rates to precision metrics. Level up your game with insights!</p>
					</div>	
				</div>
			</div>
		</div>
    </section>
  `;
}
