import { User } from '../interfaces/user';
declare const axios: any;

export const attachPlayNowPong = async () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    let socket = null;
	let roomId = null;
	let left = 'Player 1';
    let right = 'Player 2';
    let started = false;
    let gameOver = false;
	let gameType = null;
    const keyPressed = {};
    let keyInt = null;

    (window as any).pongClean = function clean() {
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

    // Send paddle movement with arrow up, down, w and s
    window.addEventListener('keydown', (e) => {
      keyPressed[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key) && started) {
        e.preventDefault(); // Prevent scrolling
      }
    });
    window.addEventListener('keyup', (e) => {
      keyPressed[e.key] = false;
      if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key) && started) {
        e.preventDefault(); // Prevent scrolling
      }
    });
    function handleInput() {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;

      if (gameType === 'local') {
        if (keyPressed['w']) {
          socket.send(JSON.stringify({ type: 'localMove', direction: 'up', paddleNumber: 1 }));
        }
        if (keyPressed['s']) {
          socket.send(JSON.stringify({ type: 'localMove', direction: 'down', paddleNumber: 1 }));
        }
        if (keyPressed['ArrowUp']) {
          socket.send(JSON.stringify({ type: 'localMove', direction: 'up', paddleNumber: 2 }));
        }
        if (keyPressed['ArrowDown']) {
          socket.send(JSON.stringify({ type: 'localMove', direction: 'down', paddleNumber: 2 }));
        }
      } else if (gameType === 'ai') {
        if (keyPressed['ArrowUp'] || keyPressed['w']) {
          socket.send(JSON.stringify({ type: 'aiMove', direction: 'up' }));
        }
        if (keyPressed['ArrowDown'] || keyPressed['s']) {
          socket.send(JSON.stringify({ type: 'aiMove', direction: 'down' }));
        }
      }
    }

// local game
    function connect() {
      socket = new WebSocket(`wss://${location.hostname}/ws`);

      socket.onopen = () => {
        if (roomId == null) {
          document.getElementById('status').innerHTML = `
		      <p id="status" class="mt-4 text-2xl text-blue-300">Connected - Joining...</p>
		  `;
          socket.send(JSON.stringify({ type: 'local' }));
        }
        else {
          socket.send(JSON.stringify({ type: 'localReconnect', roomId: roomId }));

          document.getElementById('status').innerHTML = `
              <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Disconnected. Click the button to reconnect:</p>
              <button id="reconnectBtn" class="px-4 py-2 rounded-xlbg-indigo-700 hover:bg-indigo-800 text-white shadow-md transition drop-shadow-[0_0_5px_#3B82F6]">Reconnect</button>
          `;
          document.getElementById('reconnectBtn').onclick = () => {
            socket.send(JSON.stringify({ type: 'localReconnect', roomId: roomId }));
          };
        }

      };
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'waiting_ready') {
          roomId = msg.roomId;
          document.getElementById('status').innerHTML = `
		      <form id="playername" class="text-center space-y-4 mt-6">
		          <div class="flex flex-col sm:flex-row justify-center items-center gap-4">
		              <label class="text-purple-300 font-mono drop-shadow-[0_0_5px_#8B5CF6]">
		                  Player Left:
		                  <input id="p1" required
		                  class="ml-2 bg-gray-800 border border-purple-500 text-white px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400" />
		              </label>
		              <label class="text-blue-300 font-mono drop-shadow-[0_0_5px_#3B82F6]">
		                  <input id="p2" required
		                  class="ml-2 bg-gray-800 border border-blue-500 text-white px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400" />
		                  :Player Right
		              </label>
		          </div>
		          <button type="submit"
		              class="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold drop-shadow-[0_0_5px_#3B82F6] py-2 px-4 rounded shadow-lg transition-all duration-200">
		              Start Game
		          </button>
		      </form>
		  `;
          const form = document.getElementById('playername');
          if (!form) {
              console.error("playerForm not found in the DOM!");
              return;
          }
          form.addEventListener('submit', async function(event) {
              event.preventDefault();

              left = (document.getElementById("p1") as HTMLInputElement).value;
              right = (document.getElementById("p2") as HTMLInputElement).value;
              socket.send(JSON.stringify({ type: 'localReady', roomId: roomId }));
          });
        } else if (msg.type === 'game_start') {
          started = true;
          keyInt = setInterval(handleInput, 1000 / 30);
          document.getElementById('status').innerHTML = `
		      <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Game started!</p>
		  `;
        } else if (msg.type === 'game_tick') {
          draw(msg.state);
        } else if (msg.type === 'game_over') {
          gameOver = true;
          started = false;
          clearInterval(keyInt);
          if (msg.winner.id === 1) {
            document.getElementById('status').innerHTML = `
		        <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Game Over! Winner: ${left}</p>
		    `;
          } else {
            document.getElementById('status').innerHTML = `
		        <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Game Over! Winner: ${right}</p>
		    `;
          }
        } else if (msg.type === 'room_closed') {
          document.getElementById('status').innerHTML = `
		      <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Room closed: ${msg.reason}</p>
		  `;
        } else if (msg.type === 'reconnected') {
          document.getElementById('status').innerHTML = `
		      <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Reconnected to room ${msg.roomId}</p>
		  `;
        }
      };

      socket.onclose = () => {
        if (!gameOver && started) {
          connect();
        }
        if (!gameOver) {
          document.getElementById('status').innerHTML = `
		      <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Disconnected</p>
		  `;
        }
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    }

    // Ai Game
    function connectAi() {
      socket = new WebSocket(`wss://${location.hostname}/ws`);

      socket.onopen = () => {
        if (roomId == null) {
          document.getElementById('status').innerHTML = `
		      <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Connected - Joining...</p>
		  `;
          socket.send(JSON.stringify({ type: 'ai' }));
        }
        else {
          socket.send(JSON.stringify({ type: 'aiReconnect', roomId: roomId }));

          document.getElementById('status').innerHTML = `
              <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Disconnected. Click the button to reconnect:</p>
              <button id="reconnectBtn" class="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white shadow-md transition drop-shadow-[0_0_5px_#3B82F6]">Reconnect</button>
          `;
          document.getElementById('reconnectBtn').onclick = () => {
            socket.send(JSON.stringify({ type: 'aiReconnect', roomId: roomId }));
          };
        }
      };
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'waiting_ready') {
          roomId = msg.roomId;
          document.getElementById('status').innerHTML = `
		      <div class="drop-shadow-[0_0_5px_#3B82F6]">Please choose your paddle:</div>
              <div class="flex justify-center items-center gap-4 mt-4">
                  <button id="left" class="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white shadow-md transition drop-shadow-[0_0_5px_#8B5CF6]">Left</button>
                  <button id="right" class="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white shadow-md transition drop-shadow-[0_0_5px_#3B82F6]">Right</button>
              </div>
          `;
          document.getElementById('left').onclick = () => {
            socket.send(JSON.stringify({ type: 'aiReadyLeft', roomId: roomId }));
          };
          document.getElementById('right').onclick = () => {
            socket.send(JSON.stringify({ type: 'aiReadyRight', roomId: roomId }));
          };
        } else if (msg.type === 'game_start') {
          started = true;
          keyInt = setInterval(handleInput, 1000 / 30);
          document.getElementById('status').innerHTML = `
		      <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Game started!</p>
		  `;
        } else if (msg.type === 'game_tick') {
          draw(msg.state);
        } else if (msg.type === 'game_over') {
          gameOver = true;
          started = false;
          clearInterval(keyInt);
          if (msg.result.win === 1) {
            document.getElementById('status').innerHTML = `
		        <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Game Over! You Win!</p>
		    `;
          } else {
            document.getElementById('status').innerHTML = `
		        <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Game Over! You Lose!</p>
		    `;
          }
        } else if (msg.type === 'room_closed') {
          document.getElementById('status').innerHTML = `
		      <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Room closed: ${msg.reason}</p>
		  `;
        } else if (msg.type === 'reconnected') {
          document.getElementById('status').innerHTML = `
		      <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Reconnected to room ${msg.roomId}</p>
		  `;
        }
      };

      socket.onclose = () => {
        if (!gameOver && started) {
          connectAi();
        }
        if (!gameOver) {
          document.getElementById('status').innerHTML = `
		      <p id="status" class="mt-4 text-2xl text-blue-300 drop-shadow-[0_0_5px_#3B82F6]">Disconnected</p>
		  `;
        }
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    }

    document.getElementById('status').innerHTML = `
        <div class="drop-shadow-[0_0_5px_#3B82F6]">Please choose the game type you want:</div>
        <div class="flex justify-center items-center gap-4 mt-4">
            <button id="local" class="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white shadow-md transition drop-shadow-[0_0_5px_#8B5CF6]">Local 1v1</button>
            <button id="ai" class="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white shadow-md transition drop-shadow-[0_0_5px_#3B82F6]">Against AI</button>
        </div>
    `;
    document.getElementById('local').onclick = () => {
        gameType = 'local';
        connect();
    };
    document.getElementById('ai').onclick = () => {
        gameType = 'ai';
        connectAi();
    };
}

export const renderPlayNow = () => {
	return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex justify-between items-center">
						<p class="font-extralight text-xl" id="username-greeting">Hi, welcome 👋, here you can play Pong against AI or 1v1 against someone playing on the same keyboard.</p>
					</div>
					<div class="text-center text-purple-300 font-mono">
						<h1 class="text-2xl mb-4 tracking-widest drop-shadow-[0_0_5px_#8B5CF6]">
							PONG: Hope You Have Fun!
						</h1>
						<canvas id="gameCanvas" class="mx-auto bg-black border-2 border-purple-600 rounded-xl shadow-[0_0_20px_#7C3AED]" width="500" height="500"></canvas>
						<p id="status" class="mt-4 text-2xl text-blue-300">Connecting...</p>
					</div>
				</div>
	  `;
}
