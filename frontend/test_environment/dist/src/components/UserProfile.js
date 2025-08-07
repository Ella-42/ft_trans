import { updateHeaderInNavbar } from '../tools/helper.js';
export const attachUserProfileListener = async (page = 1) => {
    updateHeaderInNavbar("User profile");
    try {
        const idResponse = await axios.get('https://trans.ella-peeters.me/api/whoami');
        const userId = idResponse.data.id;
        const matchResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/history?page=${page}`);
        const { totalCount, results: matchHistoryArray, totalPages, currentPage } = matchResponse.data;
        const winsAndLossesResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/pong`);
        const wins = winsAndLossesResponse.data.pong_wins;
        const losses = winsAndLossesResponse.data.pong_losses;
        const container = document.getElementById("dashboard-content");
        if (container) {
            container.innerHTML = renderUserProfile(userId, totalCount, wins, losses, matchHistoryArray, currentPage, totalPages);
            attachPaginationListeners(currentPage, totalPages);
        }
    }
    catch (error) {
        console.error("The error is: ", error);
        const container = document.getElementById("dashboard-content");
        if (container) {
            container.innerHTML = `<p class="text-red-500">Error loading stats.</p>`;
        }
    }
};
const attachPaginationListeners = (currentPage, totalPages) => {
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                attachUserProfileListener(currentPage - 1);
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (currentPage < totalPages) {
                attachStatsListener(currentPage + 1);
            }
        });
    }
};
export const renderUserProfile = (userId, totalCount, wins, losses, matchHistoryArray, currentPage, totalPages) => {
    return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex flex-col justify-between">
						<div>
							<h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Statistics</h1>
							<p class="text-slate-400">Track your Pong performance and match history</p>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-3 mt-6 gap-4">
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Total matches</h2>
								<p class="text-2xl font-bold text-white">${totalCount}</p>
								<p class="text-xs text-slate-400">Games played</p>
							</div>
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Total wins</h2>
								<p class="text-2xl font-bold text-white">${wins}</p>
								<p class="text-xs text-slate-400">Wins</p>
							</div>
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Total losses</h2>
								<p class="text-2xl font-bold text-white">${losses}</p>
								<p class="text-xs text-slate-400">Losses</p>
							</div>

						</div>
						<div class="grid grid-cols-1 mt-6 gap-4">
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300 mb-4">Recent matches</h2>
								${matchHistoryArray.length > 0 ? `
								<div class="grid grid-cols-1 gap-4">
									${matchHistoryArray.map(match => {
        const date = new Date(match.time);
        const formattedTime = date.toLocaleString('nl-BE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        return `
      									<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 bg-slate-600 rounded-md py-4 px-8 items-center">
										<p class="${userId === match.winner.id ? 'bg-green-500/20 p-2 text-green-400 w-min h-min rounded-md text-sm border border-green-500/30' : 'bg-red-500/20 p-2 text-red-400 w-min h-min rounded-md text-sm border border-red-500/30'}">${userId === match.winner.id ? "WIN" : "LOSS"}</p>
										<p class="text-sm text-white">vs. ${userId === match.winner.id ? match.winner.nickname : match.loser.nickname}</p>
        									<p class="text-xs text-slate-400">Score: 4-12</p>
        									<p class="text-xs text-slate-400">${formattedTime}</p>
      									</div>
   								 	`;
    }).join('')}
								 </div>
								 <div class="flex justify-center mt-6 space-x-4">
  									<button id="prev-page" class="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50" ${currentPage === 1 ? "disabled" : ""}>Previous</button>
  									<span class="text-slate-300 text-sm pt-2">Page ${currentPage} of ${totalPages}</span>
 									<button id="next-page" class="px-4 py-2 bg-slate-700 text-white rounded disabled:opacity-50" ${currentPage === totalPages ? "disabled" : ""}>Next</button>
								</div>
								` : `
							     	<p class="text-slate-400 text-sm">No matches found.</p>
								`}
							</div>
						</div>
					</div>	
				</div>
	  `;
};
