import { User } from '../interfaces/user';
import { updateHeaderInNavbar } from '../tools/helper.js';
declare const axios: any;

export const attachStatsListener= async () => {
	console.log("The attachStatsListener runs");

	setTimeout(() => updateHeaderInNavbar("Statistics"),50);

	try {
		const idResponse = await axios.get('https://trans.ella-peeters.me/api/whoami');
    		const userId = idResponse.data.id;
    		const matchResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/history`);
		const totalCount = matchResponse.data.totalCount;
    		const winsAndLossesResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/pong`);
		const wins = winsAndLossesResponse.data.pong_wins;
		const losses = winsAndLossesResponse.data.pong_losses;

    		const container = document.getElementById("dashboard-content");
    		if (container) {
      			container.innerHTML = renderStats(totalCount, wins, losses);
    		}
  	} catch (error) {
    		console.error("The error is: ", error);
    		const container = document.getElementById("dashboard-content");
    		if (container) {
      			container.innerHTML = `<p class="text-red-500">Error loading stats.</p>`;
    		}
  	}
};

export const renderStats = (totalCount: number, wins: number, losses: number) => {
	return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex flex-col justify-between">
						<div>
							<h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Statistics</h1>
							<p className="text-slate-400">Track your Pong performance and match history</p>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-3 mt-6 gap-4">
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Total matches</h2>
								<p class="ext-2xl font-bold text-white">${totalCount}</p>
								<p class="text-xs text-slate-400">Games played</p>
							</div>
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Total wins</h2>
								<p class="ext-2xl font-bold text-white">${wins}</p>
								<p class="text-xs text-slate-400">Wins</p>
							</div>
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Total losses</h2>
								<p class="ext-2xl font-bold text-white">${losses}</p>
								<p class="text-xs text-slate-400">Losses</p>
							</div>

						</div>
					</div	
				</div>
	  `;
}
