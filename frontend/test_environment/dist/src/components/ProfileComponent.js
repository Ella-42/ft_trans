import { updateHeaderInNavbar } from '../tools/helper.js';
import { drawGraph } from './StatsComponent.js';
let userId;
export const attachProfileListener = async (id) => {
    updateHeaderInNavbar("Profile");
    if (!id) {
        const idResponse = await axios.get('https://trans.ella-peeters.me/api/whoami');
        userId = idResponse.data.id;
    }
    else {
        userId = id;
    }
    const user = await (await fetch(`/api/users/${userId}`, { method: 'GET' })).json();
    if (user.avatar)
        document.getElementById('avatar').src = user.avatar;
    document.getElementById('nickname').textContent = user.nickname;
    const status = (await (await fetch(`/api/users/${userId}/ping`, { method: 'GET' })).json()).message;
    const statusDot = document.getElementById('statusDot');
    if (status === 'Online')
        statusDot.classList.add('bg-green-600');
    else if (status === 'Offline')
        statusDot.classList.add('bg-gray-500');
    else
        statusDot.classList.add('bg-orange-400');
    document.getElementById('status').textContent = status;
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
export const renderProfile = () => {
    return `
    <div class="flex flex-col flex-1 p-6">
      <div class="bg-gray-900 rounded-xl p-8 space-y-8">

        <div class="flex items-center gap-6 bg-slate-800 p-6 rounded-xl">
          <div class="w-32 h-32 rounded-md overflow-hidden border border-slate-700">
            <img id="avatar" src="https://www.pngarts.com/files/10/Default-Profile-Picture-Download-PNG-Image.png" alt="Avatar" class="h-full w-full object-cover">
          </div>
          <div class="flex flex-col">
            <h1 id="nickname" class="text-3xl font-bold text-white truncate max-w-[500px]">Nickname</h1>
            <div class="flex items-center gap-2 mt-2">
              <span id="statusDot" class="h-2 w-2 rounded-full"></span>
              <span id="status" class="text-sm text-gray-400">Offline</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center text-center">
          <h2 class="text-lg font-semibold mb-2">Score difference over time</h2>
          <div class="flex space-x-4">
            <div class="w-3 h-1 mt-2 bg-green-600 rounded-sm"></div>
            <span class="text-sm"> Wins</span>
            <div class="w-3 h-1 mt-2 bg-red-600 rounded-sm"></div>
            <span class="text-sm"> Losses</span>
          </div>
          <canvas id="scoreGraph" width="800" height="400" class="mt-4"></canvas>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>
    </div>
  `;
};
