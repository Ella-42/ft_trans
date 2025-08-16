import { updateHeaderInNavbar } from '../tools/helper.js';
declare const axios: any;

export const attachTournamentPong = async () => {
	updateHeaderInNavbar("Pong Tournament");
	const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
	const ctx = canvas.getContext('2d');
	let socket = null;
	let paddleNumber = null;
	let started = false;
	let gameOver = false;
	let tRoomId = null;
	let matchId = null;
	let roundWinners = [];
	let waitInterval = null;
	let tournamentData = { rounds: [], currentRoundIdx: 0 };
	let tournamentOver = false;
	const keyPressed = {};
	let keyInt = null;
	let downListener = null;
	let upListener = null;

	(window as any).pongTournamentClean = function clean() {
		window.removeEventListener('keydown', downListener);
		window.removeEventListener('keyup', upListener);
		if (keyInt) clearInterval(keyInt);
		if (waitInterval) clearInterval(waitInterval);
		if (socket) {
			socket.onclose = null;
			socket.onmessage = null;
			socket.onerror = null;
			socket.close();
			socket = null;
		}
		document.getElementById('tournament-scoreboard')?.remove();
	};

	function draw(game) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Ball
		ctx.beginPath();
		ctx.arc(game.ballX, game.ballY, 12.5, 0, 2 * Math.PI);
		ctx.fillStyle = '#0099FF';
		ctx.shadowColor = '#AB5CFF'
		ctx.shadowBlur = 7;
		ctx.fill();

		// Paddles
		ctx.fillStyle = '#0099FF';
		ctx.shadowColor = '#AB5CFF'
		ctx.shadowBlur = 5;

		// Left paddle
		ctx.beginPath();
		ctx.roundRect(game.paddle1.x, game.paddle1.y, game.paddle1.width, game.paddle1.height, 16);
		ctx.fill();

		// Right paddle
		ctx.beginPath();
		ctx.roundRect(game.paddle2.x, game.paddle2.y, game.paddle2.width, game.paddle2.height, 16);
		ctx.fill();

		// Scores
		ctx.font = '16px monospace';
		ctx.fillStyle = '#B62EFF';
		ctx.shadowColor = '#6A00A3'
		ctx.shadowBlur = 5;
		ctx.fillText(`Player 1: ${game.player1Score}`, 50, 30);
		ctx.fillText(`Player 2: ${game.player2Score}`, canvas.width - 150, 30);
	}

	async function currentId() {
		try {
			const res = await fetch('/api/whoami', {
				method: 'GET',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' }
			});
			if (!res.ok) throw new Error('Failed to fetch user ID');
			const users = await res.json();
			return users.id;
		} catch (err) {
			console.error('Error in currentId():', err);
			return null;
		}
	}

	downListener = (e) => {
		keyPressed[e.key] = true;
		if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key) && started) e.preventDefault();
	};
	upListener = (e) => {
		keyPressed[e.key] = false;
		if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key) && started) e.preventDefault();
	};
	window.addEventListener('keydown', downListener);
	window.addEventListener('keyup', upListener);

	function handleInput() {
		if (!socket || socket.readyState !== WebSocket.OPEN) return;
		if (keyPressed['ArrowUp'] || keyPressed['w']) socket.send(JSON.stringify({ type: 'move', direction: 'up' }));
		if (keyPressed['ArrowDown'] || keyPressed['s']) socket.send(JSON.stringify({ type: 'move', direction: 'down' }));
	}

	function sendWaitNextT() {
		if (socket && socket.readyState === WebSocket.OPEN && tRoomId) {
			socket.send(JSON.stringify({ type: 'waitNextT', tRoomId }));
		}
	}

	function startWaitPolling() {
		if (waitInterval) clearInterval(waitInterval);
		waitInterval = setInterval(sendWaitNextT, 3000);
		sendWaitNextT();
	}

	// BRACKET & SCOREBOARD RENDERING
	function renderTournamentScoreboard(tournamentData) {
	const scoreboardDiv = document.getElementById('tournament-scoreboard');
	if (!scoreboardDiv) return;
	if (!tournamentData || !tournamentData.rounds.length) {
		scoreboardDiv.innerHTML = `<p class="text-purple-600/60 italic font-mono">Scoreboard not yet available...</p>`;
		return;
	}

	let html = '';
	html += `<div class="overflow-x-auto">`;
	for (let i = 0; i < tournamentData.rounds.length; ++i) {
		const round = tournamentData.rounds[i];
		html += `
		<div class="flex flex-col items-center mt-4">
			<h3 class="font-mono text-md text-purple-400 mb-1">Round ${round.roundNumber}</h3>
			<div class="bg-black bg-opacity-60 border border-purple-700 rounded-lg mb-4 overflow-x-auto">
				<table class="w-full font-mono text-sm text-center">
					<thead>
						<tr class="text-purple-300 whitespace-nowrap">
							<th class="py-1 px-2">Match</th>
							<th class="py-1 px-2">Player 1</th>
							<th class="py-1 px-2">Score</th>
							<th class="py-1 px-2">Player 2</th>
							<th class="py-1 px-2">Status</th>
						</tr>
					</thead>
					<tbody>`;

		round.matches.forEach((m, idx) => {
			const p1 = m.players && m.players[0] ? m.players[0].name : 'TBD';
			const p2 = m.players && m.players[1] ? m.players[1].name : 'TBD';
			const score = (m.score && typeof m.score.player1 === 'number' && typeof m.score.player2 === 'number')
				? `<span class="text-blue-400">${m.score.player1}</span> - <span class="text-blue-400">${m.score.player2}</span>`
				: (m.score ? `<span class="text-blue-400">${m.score.player1}</span> - <span class="text-blue-400">${m.score.player2}</span>` : '-');
			const status = m.status === 'waiting' ? '<span class="text-purple-500">Waiting</span>'
				: m.status === 'in_progress' ? '<span class="text-yellow-400">Playing</span>'
				: m.status === 'finished' ? '<span class="text-green-400">Finished</span>'
				: '';
			html += `
				<tr class="${
					m.status === 'finished'
						? 'bg-green-900/40'
						: m.status === 'in_progress'
							? 'bg-yellow-900/40'
							: 'bg-gray-900/40'
				}">
					<td class="py-1 px-2">${idx + 1}</td>
					<td class="py-1 px-2 truncate" title="${p1}">${p1}</td>
					<td class="py-1 px-2">${score}</td>
					<td class="py-1 px-2 truncate" title="${p2}">${p2}</td>
					<td class="py-1 px-2">${status}</td>
				</tr>
			`;
		});
		html += `</tbody></table></div></div>`;
	}
	html += `</div>`;
	scoreboardDiv.innerHTML = html;
}

	// Convert raw tournament_status messages into bracket form
	function updateBracketData(msg) {
		const roundIdx = msg.round - 1;
		tournamentData.currentRoundIdx = roundIdx;
		tournamentData.rounds[roundIdx] = {
			roundNumber: msg.round,
			matches: msg.matches.map(match => ({
				matchId: match.matchId,
				status: match.status,
				players: match.players,
				score: match.score,
				winner: match.score && match.score.player1 === 'Winner' ? match.players[0] : match.score && match.score.player2 === 'Winner' ? match.players[1] : undefined
			}))
		};
		renderTournamentScoreboard(tournamentData);
	}

	function connect() {
		socket = new WebSocket(`wss://${location.hostname}/ws`);

		socket.onopen = () => {
			document.getElementById('status').textContent = 'Connected - Joining tournament...';
			socket.send(JSON.stringify({ type: 'tournament' }));
		};

		socket.onmessage = async (event) => {
			const msg = JSON.parse(event.data);
			if (msg.type === 'joinedTRoom') {
				tRoomId = msg.tRoomId;
				document.getElementById('status').textContent = `Joined tournament room: ${tRoomId}, waiting for players...`;
				renderTournamentScoreboard(tournamentData);
			} else if (msg.type === 'waiting_t_ready') {
				matchId = msg.matchId;
				paddleNumber = msg.paddleNumber;
				document.getElementById('status').textContent = `Match #${matchId} ready! Round #${msg.roundNumber} | You are player ${paddleNumber}`;
				socket.send(JSON.stringify({ type: 'ready', roomId: matchId }));
			} else if (msg.type === 'game_start') {
				keyInt = setInterval(handleInput, 1000 / 30);
				started = true;
				gameOver = false;
				document.getElementById('status').textContent = `Game started! You are player ${paddleNumber}`;
			} else if (msg.type === 'game_tick') {
				draw(msg.state);
				// Update status if still playing
				if (started && !gameOver) {
					document.getElementById('status').textContent = `Game in progress! You are player ${paddleNumber}`;
				}
			} else if (msg.type === 'game_over') {
				gameOver = true;
				started = false;
				clearInterval(keyInt);
				await currentId().then(currentUserId => {
					if (msg.winner.id === currentUserId) {
						document.getElementById('status').textContent = `You WIN this match! Winner: ${msg.winner.name}`;
					} else {
						document.getElementById('status').textContent = `You LOSE this match. Winner: ${msg.winner.name}`;
					}
				});
				startWaitPolling();
			} else if (msg.type === 'tournament_status') {
				updateBracketData(msg);
			} else if (msg.type === 'Roundwinner') {
				roundWinners = msg.winnerlist;
				const currentUid = await currentId();
				const advanced = roundWinners.some(w => w.id === currentUid);
				document.getElementById('status').textContent = advanced
					? 'Congratulations! You advanced to the next round!'
					: 'You are out, but you can still watch the tournament!';
				renderTournamentScoreboard(tournamentData);
			} else if (msg.type === 'requestNewWait') {
				startWaitPolling();
			} else if (msg.type === 'tournamentOver') {
				tournamentOver = true;
				clearInterval(waitInterval);
				const winner = msg.winner;
				const myUid = await currentId();
				let statusMsg;
				if (winner.id === myUid) {
					statusMsg = `🏆 CONGRATULATIONS! YOU ARE THE TOURNAMENT WINNER! 🏆`;
				} else {
					statusMsg = `Tournament over! Winner: ${winner.name} (UID: ${winner.id})`;
				}
				document.getElementById('status').textContent = statusMsg;
			}
		};

		socket.onclose = () => {
			if (!gameOver) document.getElementById('status').textContent = 'Disconnected';
		};

		socket.onerror = (err) => {
			console.error('WebSocket error:', err);
		};
	}

	const myuid = await currentId();
	document.getElementById('title').textContent = 'TOURNAMENT PONG: Good luck! Your UID: ' + myuid;
	connect();
	renderTournamentScoreboard(tournamentData);
};

export const renderTournament = () => {
	return `
		<div class="px-5 flex flex-col md:flex-col flex-1">
			<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex justify-between items-center">
				<p class="font-extralight text-xl" id="username-greeting">👋 Welcome to the tournament! Rounds will start as soon as enough players joined.</p>
			</div>
			<div class="text-center text-purple-300 font-mono">
				<h1 id="title" class="text-2xl mb-4 tracking-widest drop-shadow-[0_0_5px_#8B5CF6]">
					TOURNAMENT PONG: Good luck! Your UID:
				</h1>
				<canvas id="gameCanvas" class="mx-auto bg-black border-2 border-purple-600 rounded-xl shadow-[0_0_20px_#7C3AED]" width="500" height="500"></canvas>
				<pre id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6] whitespace-pre-line">Connecting...</pre>
				<div id="tournament-scoreboard" class="mt-6"></div>
			</div>
		</div>
	`;
};
