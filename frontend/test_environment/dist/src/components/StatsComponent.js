import { updateHeaderInNavbar } from '../tools/helper.js';
let userId;
export const attachStatsListener = async () => {
    updateHeaderInNavbar("Statistics");
    const idResponse = await axios.get('https://trans.ella-peeters.me/api/whoami');
    userId = idResponse.data.id;
    const matches = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/history?limit=1000`);
    const { totalCount, results: matchHistoryArray } = matches.data;
    const scoreData = getScoreData(matchHistoryArray);
    drawGraph(scoreData, 'scoreGraph');
    const winsAndLossesResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/pong`);
    const wins = winsAndLossesResponse.data.pong_wins;
    const losses = winsAndLossesResponse.data.pong_losses;
    document.getElementById('total').textContent = totalCount;
    document.getElementById('wins').textContent = wins;
    document.getElementById('losses').textContent = losses;
    document.getElementById('ratio').textContent = losses ? (wins / losses).toFixed(2) : '∞';
    try {
        attachStatsPageListener();
    }
    catch (error) {
        console.error("The error is: ", error);
        const container = document.getElementById("dashboard-content");
        if (container) {
            container.innerHTML = `<p class="text-red-500">Error loading stats.</p>`;
        }
    }
};
const attachStatsPageListener = async (page = 1) => {
    const matchResponse = await axios.get(`https://trans.ella-peeters.me/api/users/${userId}/history?page=${page}&limit=10`);
    const { results: matchHistoryArray, totalPages, currentPage } = matchResponse.data;
    const scoreData = getScoreData(matchHistoryArray);
    const container = document.getElementById("matchPages");
    if (container) {
        container.innerHTML = renderMatchPages(userId, matchHistoryArray, currentPage, totalPages);
        drawGraph(scoreData, 'pageScoreGraph');
        attachPaginationListeners(currentPage, totalPages);
    }
};
const attachPaginationListeners = (currentPage, totalPages) => {
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                attachStatsPageListener(currentPage - 1);
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (currentPage < totalPages) {
                attachStatsPageListener(currentPage + 1);
            }
        });
    }
};
const getScoreData = (matches) => {
    return matches.map(match => {
        const [score1, score2] = match.info.split('-').map(Number);
        const winnerScore = score1 > score2 ? score1 : score2;
        const loserScore = score1 > score2 ? score2 : score1;
        let diff = winnerScore - loserScore;
        if (match.winner.id !== userId)
            diff = -diff;
        return { time: match.time, diff };
    });
};
const drawGraph = (scoreData, elementId) => {
    const canvas = document.getElementById(elementId);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const total = scoreData.length;
    if (total < 2)
        return canvas.replaceWith('too little data...');
    const diffs = scoreData.map(data => data.diff);
    const normalizedDiffs = scoreData.map(data => Math.abs(data.diff));
    const minDiff = Math.min(...normalizedDiffs);
    let maxDiff = Math.max(...normalizedDiffs);
    if (maxDiff === minDiff)
        maxDiff = minDiff + 1;
    const padding = 50;
    const xScale = (index) => padding + ((total - 1 - index) / (total - 1)) * (canvas.width - padding * 2);
    const yScale = (diff) => canvas.height - padding - ((Math.abs(diff) - minDiff) / (maxDiff - minDiff)) * (canvas.height - padding * 2);
    ctx.strokeStyle = '#16a34a';
    ctx.beginPath();
    scoreData.forEach((point, i) => {
        if (point.diff > 0) {
            const x = xScale(i);
            const y = yScale(point.diff);
            if (i === 0)
                ctx.moveTo(x, y);
            else
                ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    scoreData.forEach((point, i) => {
        if (point.diff < 0) {
            const x = xScale(i);
            const y = yScale(point.diff);
            if (i === 0)
                ctx.moveTo(x, y);
            else
                ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    const tickCount = 9;
    const tickLength = 5;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.font = '12px sans-serif';
    for (let i = 0; i <= tickCount; i++) {
        const matchIndex = Math.floor(i * (total - 1) / tickCount);
        const x = xScale(matchIndex);
        const date = new Date(scoreData[matchIndex].time);
        const label = date.toLocaleDateString('nl-BE', { month: 'short', day: 'numeric' });
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - padding);
        ctx.lineTo(x, canvas.height - padding + tickLength);
        ctx.stroke();
        ctx.fillText(label, x - 15, canvas.height - padding + tickLength + 20);
    }
    for (let i = 0; i <= tickCount; i++) {
        const diffVal = minDiff + ((maxDiff - minDiff) / tickCount) * i;
        const y = yScale(diffVal);
        ctx.beginPath();
        ctx.moveTo(padding - tickLength, y);
        ctx.lineTo(padding, y);
        ctx.stroke();
        ctx.fillText(diffVal.toFixed(1), 15, y + 4);
    }
};
export const renderStats = () => {
    return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex flex-col justify-between">
						<div>
							<h1 class="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Statistics</h1>
							<p class="text-slate-400">Track your Pong performance and match history</p>
						</div>
						<div class="flex flex-col items-center mt-6 text-center">
							<h2 class="text-lg font-semibold mb-2">Score difference over time</h2>
							<div class="flex space-x-4">
								<div class="w-3 h-1 mt-2 bg-green-600 rounded-sm"></div>
								<span class="text-sm"> Wins</span>
								<div class="w-3 h-1 mt-2 bg-red-600 rounded-sm"></div>
								<span class="text-sm"> Losses</span>
							</div>
							<canvas id="scoreGraph" width="800" height="400"></canvas>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-4 mt-6 gap-4">
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Total matches</h2>
								<p id="total" class="text-2xl font-bold text-white"></p>
								<p class="text-xs text-slate-400">Games played</p>
							</div>
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Total wins</h2>
								<p id="wins" class="text-2xl font-bold text-white"></p>
								<p class="text-xs text-slate-400">Wins</p>
							</div>
							<div class="py-4 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Total losses</h2>
								<p id="losses" class="text-2xl font-bold text-white"></p>
								<p class="text-xs text-slate-400">Losses</p>
							</div>
							<div class="py-6 px-8 bg-slate-800 rounded-md">
								<h2 class="text-sm font-medium text-slate-300">Win/loss ratio</h2>
								<p id="ratio" class="text-2xl font-bold text-white"></p>
							</div>
						</div>
						<div class="grid grid-cols-1 mt-6 gap-4">
							<div id="matchPages" class="py-4 px-8 bg-slate-800 rounded-md">
							</div>
						</div>
					</div>
				</div>
	  `;
};
const renderMatchPages = (userId, matchHistoryArray, currentPage, totalPages) => {
    return `
				<div class="flex flex-col items-center mt-6 text-center">
					<h2 class="text-lg font-semibold mb-2">Recent score difference</h2>
					<div class="flex space-x-4">
						<div class="w-3 h-1 mt-2 bg-green-600 rounded-sm"></div>
						<span class="text-sm"> Wins</span>
						<div class="w-3 h-1 mt-2 bg-red-600 rounded-sm"></div>
						<span class="text-sm"> Losses</span>
					</div>
					<canvas id="pageScoreGraph" width="800" height="400"></canvas>
				</div>
				<h2 class="text-sm font-medium text-slate-300 mb-4">Match history</h2>
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
							<p class="text-sm text-white">vs. ${userId === match.winner.id ? match.loser.nickname : match.winner.nickname}</p>
							<p class="text-xs text-slate-400">Score: ${match.info}</p>
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
	  `;
};
