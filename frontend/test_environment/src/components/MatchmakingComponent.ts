import { User } from '../interfaces/user';
declare const axios: any;

export const attachMatchmakingPong = async () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    let socket = null;
    let paddleNumber = null;
    let started = false;
    let gameOver = false;
    const keyPressed = {};
    let keyInt = null;
    let downListener = null;
    let upListener = null;

    (window as any).pongClean = function clean() {
		window.removeEventListener('keydown', downListener);
		window.removeEventListener('keyup', upListener);
    if (keyInt) {
      clearInterval(keyInt);
    }
		if (socket) {
			socket.onclose = null;
			socket.onmessage = null;
			socket.onerror = null;
			socket.close();
			socket = null;
		}
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
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error('Failed to fetch user ID');
        const users = await res.json();
        return (users.id);
      } catch (err) {
        console.error('Error in currentId():', err);
        return null;
      }
    }

    // Send paddle movement with arrow up, down, w and s
    downListener = (e) => {
      keyPressed[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key) && started) {
        e.preventDefault(); // Prevent scrolling
      }
    };
	upListener = (e) => {
      keyPressed[e.key] = false;
      if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key) && started) {
        e.preventDefault(); // Prevent scrolling
      }
    };
	window.addEventListener('keydown', downListener);
	window.addEventListener('keyup', upListener);

    function handleInput() {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      if (keyPressed['ArrowUp'] || keyPressed['w']) socket.send(JSON.stringify({ type: 'move', direction: 'up' }));
      if (keyPressed['ArrowDown'] || keyPressed['s']) socket.send(JSON.stringify({ type: 'move', direction: 'down' }));
    }

// start connection

    function connect() {
      socket = new WebSocket(`wss://${location.hostname}/ws`);

      socket.onopen = () => {
        document.getElementById('status').textContent = 'Connected - Joining...';
        socket.send(JSON.stringify({ type: 'auto_join' }));
      };

      socket.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'joined') {
          paddleNumber = msg.paddleNumber;
          document.getElementById('status').textContent = `Joined room ${msg.roomId} as player ${msg.paddleNumber}`;
        } else if (msg.type === 'waiting_ready') {
          socket.send(JSON.stringify({ type: 'ready', roomId: msg.roomId }));
        } else if (msg.type === 'ready_ack') {
          document.getElementById('status').textContent = 'Ready. Waiting for game start...';
        } else if (msg.type === 'game_start') {
          keyInt = setInterval(handleInput, 1000 / 30);
          started = true;
          document.getElementById('status').textContent = `Game started! You are player ${paddleNumber}`;
        } else if (msg.type === 'game_tick') {
          draw(msg.state);
        } else if (msg.type === 'game_over') {
          gameOver = true;
          started = false;
          clearInterval(keyInt);
          await currentId().then(currentUserId => {
            const isWinner = msg.winner.id === currentUserId;
            if (isWinner) {
              document.getElementById('status').textContent = `You WIN! Winner: ${msg.winner.name}, UID: ${msg.winner.id}`;
            } else {
              document.getElementById('status').textContent = `You LOSE! Winner: ${msg.winner.name}, UID: ${msg.winner.id}`;
            }
          });
        } else if (msg.type === 'room_closed') {
          document.getElementById('status').textContent = `Room closed: ${msg.reason}`;
        } else if (msg.type === 'reconnected') {
          paddleNumber = msg.paddleNumber;
          gameOver = false;
          started = true;
          if (!keyInt) {
            keyInt = setInterval(handleInput, 1000 / 30);
          }
          document.getElementById('status').textContent = `Reconnected to room ${msg.roomId}`;
        }
      };

      socket.onclose = () => {
        if (!gameOver) {
          document.getElementById('status').textContent = 'Disconnected';
        }
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    }

    const myuid = await currentId();
    document.getElementById('title').textContent = 'PONG: Hope You Have Fun! Your UID: ' + myuid;
    connect();
}

export const renderMatchmaking = () => {
	return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex justify-between items-center">
						<p class="font-extralight text-xl" id="username-greeting">Hi, welcome 👋, you will be paired as soon as someone else joins.</p>
					</div>
					<div class="text-center text-purple-300 font-mono">
						<h1 id="title" class="text-2xl mb-4 tracking-widest drop-shadow-[0_0_5px_#8B5CF6]">
							PONG: Hope You Have Fun! Your UID:
						</h1>
						<canvas id="gameCanvas" class="mx-auto bg-black border-2 border-purple-600 rounded-xl shadow-[0_0_20px_#7C3AED]" width="500" height="500"></canvas>
						<p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Connecting...</p>
					</div>
				</div>
	  `;
}
