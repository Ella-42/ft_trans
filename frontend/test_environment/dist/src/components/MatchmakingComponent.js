export const attachMatchmakingPong = async () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let socket = null;
    let paddleNumber = null;
    let started = false;
    let gameOver = false;
    const keyPressed = {};
    let keyInt = null;
    function draw(game) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Ball
        ctx.beginPath();
        ctx.arc(game.ballX, game.ballY, 12.5, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        // Paddles
        ctx.fillStyle = 'white';
        ctx.fillRect(game.paddle1.x, game.paddle1.y, game.paddle1.width, game.paddle1.height);
        ctx.fillRect(game.paddle2.x, game.paddle2.y, game.paddle2.width, game.paddle2.height);
        // Scores
        ctx.font = '20px sans-serif';
        ctx.fillText(`P1: ${game.player1Score}`, 50, 30);
        ctx.fillText(`P2: ${game.player2Score}`, canvas.width - 100, 30);
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
            if (!res.ok)
                throw new Error('Failed to fetch user ID');
            const users = await res.json();
            return (users.id);
        }
        catch (err) {
            console.error('Error in currentId():', err);
            return null;
        }
    }
    // Send paddle movement with arrow keys
    window.addEventListener('keydown', (e) => {
        keyPressed[e.key] = true;
        if (['ArrowUp', 'ArrowDown'].includes(e.key) && started) {
            e.preventDefault(); // Prevent scrolling
        }
    });
    window.addEventListener('keyup', (e) => {
        keyPressed[e.key] = false;
        if (['ArrowUp', 'ArrowDown'].includes(e.key) && started) {
            e.preventDefault(); // Prevent scrolling
        }
    });
    function handleInput() {
        if (!socket || socket.readyState !== WebSocket.OPEN)
            return;
        if (keyPressed['ArrowUp'])
            socket.send(JSON.stringify({ type: 'move', direction: 'up' }));
        if (keyPressed['ArrowDown'])
            socket.send(JSON.stringify({ type: 'move', direction: 'down' }));
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
            }
            else if (msg.type === 'waiting_ready') {
                socket.send(JSON.stringify({ type: 'ready', roomId: msg.roomId }));
            }
            else if (msg.type === 'ready_ack') {
                document.getElementById('status').textContent = 'Ready. Waiting for game start...';
            }
            else if (msg.type === 'game_start') {
                keyInt = setInterval(handleInput, 1000 / 30);
                started = true;
                document.getElementById('status').textContent = `Game started! You are player ${paddleNumber}`;
            }
            else if (msg.type === 'game_tick') {
                draw(msg.state);
            }
            else if (msg.type === 'game_over') {
                gameOver = true;
                started = false;
                clearInterval(keyInt);
                await currentId().then(currentUserId => {
                    const isWinner = msg.winner.id === currentUserId;
                    if (isWinner) {
                        document.getElementById('status').textContent = `Game Over! You WIN! Winner: ${msg.winner.name} , uid: ${msg.winner.id}`;
                    }
                    else {
                        document.getElementById('status').textContent = `Game Over! You LOSE! Winner: ${msg.winner.name} , uid: ${msg.winner.id}`;
                    }
                });
            }
            else if (msg.type === 'room_closed') {
                document.getElementById('status').textContent = `Room closed: ${msg.reason}`;
            }
            else if (msg.type === 'reconnected') {
                paddleNumber = msg.paddleNumber;
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
    document.getElementById('title').textContent = 'Pong Frontend Test: Current UID: ' + myuid;
    connect();
};
export const renderMatchmaking = () => {
    return `
				<div class="px-5 flex flex-col md:flex-col flex-1">
					<div class="px-10 py-5 rounded-xl my-5 mb-10 bg-gray-900 flex justify-between items-center">
						<p class="font-extralight text-xl" id="username-greeting">Hi, welcome 👋, you will be paired as soon as someone else joins.</p>
					</div>
					<div class="text-white text-center">
						<h1 id="title">Pong Frontend Test: Current UID: </h1>
						<p id="status">Connecting...</p>
						<canvas class="mx-auto bg-black border-2 border-white block mt-8 mb-8" id="gameCanvas" width="500" height="500"></canvas>
					</div>
				</div>
	  `;
};
