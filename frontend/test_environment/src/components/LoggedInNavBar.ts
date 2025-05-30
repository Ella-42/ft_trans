export function renderLoggedInNavBar(): string {

	return `
		<nav class="bg-gray-900 h-20">
				<div class="h-20 flex justify-between items-center">
					<h1 class="text-white font-Roboto text-2xl pl-10" id="dashboard-title">placeholder</h1>
					<div class="flex items-center gap-3 mr-10">
						<img src="./avatar.png" class="h-12"></img>
						<h2 class="text-white text-base">pclaus</h2>
						<button class="ml-10 text-base text-white bg-primary my-3 py-2 px-4 rounded-md flex items-center whitespace-nowrap hover:text-primary hover:bg-white"">Logout</button>
					</div>
			</div>
		</nav>
  `;
}
