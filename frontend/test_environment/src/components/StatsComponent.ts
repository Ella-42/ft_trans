import { User } from '../interfaces/user';
import { updateHeaderInNavbar } from '../tools/helper.js';
declare const axios: any;

export const attachStatsListener= async () => {
	console.log("The attachStatsListener runs");

	setTimeout(() => updateHeaderInNavbar("Stats"),50);
	//try {
	//	console.log("The try block works");
		//const response = await axios.get('https://trans.ella-peeters.me/api/whoami');
		//console.log("The reponse after logging in is: ", response);
		//const user = response.data;
	//} catch (error) {
	//	console.error("The error is: ", error);
	//}
};

export const renderStats = () => {
	return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex flex-col justify-between">
						<div>
							<h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Player Statistics</h1>
							<p className="text-slate-400">Track your Pong performance and match history</p>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-2 mt-6 gap-4">
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Total matches</h2>
								<p class="ext-2xl font-bold text-white">100</p>
								<p class="text-xs text-slate-400">Games played</p>
							</div>
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Total matches</h2>
								<p class="ext-2xl font-bold text-white">100</p>
								<p class="text-xs text-slate-400">Games played</p>
							</div>

						</div>
					</div	
				</div>
	  `;
}
