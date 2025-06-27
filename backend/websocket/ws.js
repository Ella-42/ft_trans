import jwt from 'jsonwebtoken';

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { Mutex } from 'async-mutex';
import cookie from '@fastify/cookie';
const roomMutex = new Mutex();
const readyMutex = new Mutex();
const oripublicKey = process.env.PUBLIC_KEY;
if (!oripublicKey) {
  throw new Error("Missing PUBLIC_KEY environment variable");
}
const publicKey = oripublicKey.replace(/\\n/g, '\n');


const fastify = Fastify();
fastify.register(websocket);

await fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET,
  parseOptions: {}
});


const rooms = {}; // format: { roomId: { players: [{ id, conn }], ready: Set, gameStarted: bool, game[{....}], gameLoopInterval } }

const localRooms = {}; // format: { roomId: { conn, connected: bool, gameStarted: bool, game[{....}], gameLoopInterval, lastActive: time } }

const aiRooms = {}; // format: { roomId: { conn, connected: bool, gameStarted: bool, game[{....}], gameLoopInterval, lastActive: time, paddle: 1/2 , aiHasStartedMoving: bool, game.aiReactionTime: time } }

function findRoomByPlayerId(playerId) {
  for (const [roomId, room] of Object.entries(rooms)) {
    if (room.players.some(player => player.id === playerId)) {
      return room;
    }
  }
  return null;
}

fastify.get('/ws', { websocket: true }, async (conn, req) => {
  conn.socket.on('message', async (message) => {
    try {
      const msg = JSON.parse(message.toString());
      if (typeof msg !== 'object' || typeof msg.type !== 'string') return;

      const { type, roomId } = msg;

      if (type === 'local') {
        await handleLocal(conn);
      } else if (type === 'localReady') {
        await localStart(roomId, conn);
      } else if (type === 'localReconnect') {
        await localReconnect(roomId, conn);
      } else if (type === 'localMove') {
        const lroomid = Object.keys(localRooms).find(rid =>
                localRooms[rid].conn.socket === conn.socket);
        if (!lroomid) {
          conn.socket.close();
          return ;
        }
        const room = localRooms[lroomid];
        const paddle = msg.paddleNumber === 1 ? room.game.paddle1 : room.game.paddle2;

        if (msg.direction === "up" && paddle.y > 0) {
          paddle.y -= PADDLE_SPEED;
        } else if (msg.direction === "down" && paddle.y < GAME_HEIGHT - paddle.height) {
          paddle.y += PADDLE_SPEED;
        }
      } else if (type === 'ai') {
        await handleAi(conn);
      } else if (type === 'aiReadyLeft') {
        await aiStart(roomId, conn, 1);
      } else if (type === 'aiReadyRight') {
        await aiStart(roomId, conn, 2);
      } else if (type === 'aiReconnect') {
        await aiReconnect(roomId, conn);
      } else if (type === 'aiMove') {
        const airoomid = Object.keys(aiRooms).find(rid =>
                aiRooms[rid].conn.socket === conn.socket);
        if (!airoomid) {
          conn.socket.close();
          return ;
        }
        const room = aiRooms[airoomid];
        const paddle = room.paddle === 1 ? room.game.paddle1 : room.game.paddle2;

        if (msg.direction === "up" && paddle.y > 0) {
          paddle.y -= PADDLE_SPEED;
        } else if (msg.direction === "down" && paddle.y < GAME_HEIGHT - paddle.height) {
          paddle.y += PADDLE_SPEED;
        }
      } else {
        try {
          const cookies = cookie.parse(req.headers.cookie || '');
          const tokenCookie = cookies.token;
      
          const token = fastify.unsignCookie(tokenCookie);
          if (!token.valid || !token.value) {
            conn.socket.close();
            return;
          }
          let decoded;
          try {
            decoded = jwt.verify(token.value, publicKey, { algorithms: ['RS256'] });
          } catch (err) {
            conn.socket.close();
            return;
          }
          conn.userId = decoded.id;
          if (!conn.userId) {
            conn.socket.close();
            return;
          }
        } catch (err) {
          conn.socket.close();
          return;
        }
      }

      if (type === 'auto_join') {
        await handleAutoJoin(conn, conn.userId);
      } else if (type === 'ready') {
        await handleReady(roomId, conn.userId, conn);
      } else if (type === 'move') {
        const room = findRoomByPlayerId(conn.userId);
        const sender = room.players.find(player => player.conn === conn);
        if (!sender) return;

        const paddle = sender.paddleNumber === 1 ? room.game.paddle1 : room.game.paddle2;

        if (msg.direction === "up" && paddle.y > 0) {
          paddle.y -= PADDLE_SPEED;
        } else if (msg.direction === "down" && paddle.y < GAME_HEIGHT - paddle.height) {
          paddle.y += PADDLE_SPEED;
        }
      }
    } catch (err) {
      console.error('Message error:', err);
    }
  });

  conn.socket.on('close', () => {
    const lroomid = Object.keys(localRooms).find(rid =>
      localRooms[rid].conn && localRooms[rid].conn.socket === conn.socket);
    if (lroomid) {
      if (localRooms[lroomid].gameStarted === false) {
        delete localRooms[lroomid];
        return ;
      }
      localRooms[lroomid].conn = null;
      localRooms[lroomid].connected = false;
      localRooms[lroomid].lastActive = Date.now();
      return ;
    }
    const airoomid = Object.keys(aiRooms).find(rid =>
      aiRooms[rid].conn && aiRooms[rid].conn.socket === conn.socket);
    if (airoomid) {
      if (aiRooms[airoomid].gameStarted === false) {
        delete aiRooms[airoomid];
        return ;
      }
      aiRooms[airoomid].conn = null;
      aiRooms[airoomid].connected = false;
      aiRooms[airoomid].lastActive = Date.now();
      return ;
    }

    const room = findRoomByPlayerId(conn.userId);
    if (!room) return;
    const player = room.players.find(p => p.id === conn.userId);
    if (player?.conn?.socket != conn.socket) {
      return ;
    }
    if (room) {
      const otherPlayer = room.players.find(p => p.id !== conn.userId);
      if (room.gameStarted === false) {
        // Notify other player if still connected
        if (otherPlayer && otherPlayer.conn && otherPlayer.conn.socket.readyState === 1) {
          otherPlayer.conn.socket.send(JSON.stringify({
            type: 'room_closed',
            reason: 'Opponent disconnected',
          }));
          otherPlayer.conn.socket.close();
        }
        delete rooms[Object.keys(rooms).find(id => rooms[id] === room)];
      }
      else {
          player.conn = null;
          console.log(`Player ${conn.userId} disconnected`);
      }
    }
  });
});

// Game logic below

const FRAME_RATE = 1000 / 60;
const GAME_WIDTH = 500;
const GAME_HEIGHT = 500;
const BALL_RADIUS = 12.5;
const PADDLE_SPEED = 50;

function createGame() {
    let ballSpeed = 3; // if level needs to be implemented, this variable should be changed
    const ballXDirection = Math.random() < 0.5 ? 1 : -1;
    const ballYDirection = (Math.random() - 0.5) * 2;
    return {
        ballX: GAME_WIDTH / 2,
        ballY: GAME_HEIGHT / 2,
        ballSpeed,
        ballXDirection,
        ballYDirection,
        player1Score: 0,
        player2Score: 0,
        paddle1: { x: 0, y: (GAME_HEIGHT - 100) / 2, width: 25, height: 100 },
        paddle2: { x: GAME_WIDTH - 25, y: (GAME_HEIGHT - 100) / 2, width: 25, height: 100 },
    };
}

function updateGame(game) {
    const {
        ballXDirection, ballYDirection, ballSpeed,
        paddle1, paddle2
    } = game;

    game.ballX += ballXDirection * ballSpeed;
    game.ballY += ballYDirection * ballSpeed;

    // Wall collisions
    if (game.ballY <= 0 + BALL_RADIUS || game.ballY >= GAME_HEIGHT - BALL_RADIUS)
        game.ballYDirection *= -1;

    // Score left/right
    if (game.ballX <= 0) {
        game.player2Score++;
        const player1Score = game.player1Score;
        const player2Score = game.player2Score;
        Object.assign(game, createGame());
        game.player1Score = player1Score;
        game.player2Score = player2Score;
    } else if (game.ballX >= GAME_WIDTH) {
        game.player1Score++;
        const player1Score = game.player1Score;
        const player2Score = game.player2Score;
        Object.assign(game, createGame());
        game.player1Score = player1Score;
        game.player2Score = player2Score;
    }

    // Paddle collisions
    if (game.ballX <= (paddle1.x + paddle1.width + BALL_RADIUS) &&
        game.ballY > paddle1.y && game.ballY < paddle1.y + paddle1.height) {
        game.ballX = paddle1.x + paddle1.width + BALL_RADIUS;
        game.ballXDirection *= -1;
        game.ballSpeed += 0.5;
    }

    if (game.ballX >= (paddle2.x - BALL_RADIUS) &&
        game.ballY > paddle2.y && game.ballY < paddle2.y + paddle2.height) {
        game.ballX = paddle2.x - BALL_RADIUS;
        game.ballXDirection *= -1;
        game.ballSpeed += 0.5;
    }
}

//AI Handling

function updateAi(game, playerPaddle) {
  const aiPaddle = playerPaddle === 1 ? game.paddle2 : game.paddle1;
  const aiSpeed = 4;

  if (!game.aiReactionTime) game.aiReactionTime = Date.now();
  if (!game.aiHasStartedMoving && Math.abs(aiPaddle.y + aiPaddle.height / 2 - game.ballY) > 10) {
    game.aiReactionTime = Date.now(); // start delay
    game.aiHasStartedMoving = true;
  }

  const now = Date.now();
  const delay = 250; // 250 milliseconds is average human reaction time, for fair competition

  if (game.aiHasStartedMoving && now - game.aiReactionTime >= delay) {
    if (aiPaddle.y + aiPaddle.height / 2 > game.ballY && aiPaddle.y > 0) {
      aiPaddle.y -= aiSpeed;
    } else if (aiPaddle.y + aiPaddle.height / 2 < game.ballY && aiPaddle.y + aiPaddle.height < GAME_HEIGHT) {
      aiPaddle.y += aiSpeed;
    }
  }

  // Reset if close enough to the ball
  if (Math.abs(aiPaddle.y + aiPaddle.height / 2 - game.ballY) <= 10) {
    game.aiHasStartedMoving = false;
  }
}

async function handleAi(conn) {
  let roomId, room;
  roomId = uuidv4();
  aiRooms[roomId] = { conn: conn, connected: true, gameStarted: false, game: createGame(), lastActive: Date.now() };
  room = aiRooms[roomId];
  conn.socket.send(JSON.stringify({ type: 'waiting_ready', roomId }));
}

async function aiReconnect(roomId, conn) {
  const room = aiRooms[roomId];
  if (!room) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
    return;
  }
  if (room.conn) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'Room has active socket connection' }));
    return ;
  }
  room.conn = conn;
  room.connected = true;
  conn.socket.send(JSON.stringify({ type: 'reconnected', roomId }));
}

async function aiStart(roomId, conn, paddle) {
  const room = aiRooms[roomId];
  if (!room || room.gameStarted) return;
  if (room.conn.socket != conn.socket) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'Room mismatch' }));
    return ;
  }
  room.paddle = paddle;
  room.connected = true;
  room.gameStarted = true;
  
  console.log(`Starting game in room ${roomId}`);
  conn.socket.send(JSON.stringify({ type: 'game_start' })); 
  room.gameLoopInterval = setInterval(async () => {
    updateGame(room.game);
    updateAi(room.game, paddle);
    if (room.game.player1Score >= 11 || room.game.player2Score >= 11) {
      if (room.game.player1Score > room.game.player2Score &&
        room.game.player1Score - room.game.player2Score >= 2) {
        clearInterval(room.gameLoopInterval);
        const result = paddle === 1 ? 1 : 0;
        if (room.conn && room.conn.socket.readyState === 1) {
          room.conn.socket.send(JSON.stringify({
            type: 'game_over',
            result: { win: result },
          }));
          room.conn.socket.close();
        }
        delete aiRooms[roomId];
      }
      else if (room.game.player2Score > room.game.player1Score &&
        room.game.player2Score - room.game.player1Score >= 2) {
        clearInterval(room.gameLoopInterval);
        const result = paddle === 2 ? 1 : 0;
        if (room.conn && room.conn.socket.readyState === 1) {
          room.conn.socket.send(JSON.stringify({
            type: 'game_over',
            result: { win: result },
          }));
          room.conn.socket.close();
        }
        delete aiRooms[roomId];
      }
    }
    if (room.conn && room.conn.socket.readyState === 1) {
      room.conn.socket.send(JSON.stringify({ type: "game_tick", state: room.game }));
    }
  }, FRAME_RATE);
}


//Local Game handling


async function handleLocal(conn) {
  let roomId, room;
  roomId = uuidv4();
  localRooms[roomId] = { conn: conn, connected: true, gameStarted: false, game: createGame(), lastActive: Date.now() };
  room = localRooms[roomId];
  conn.socket.send(JSON.stringify({ type: 'waiting_ready', roomId }));
}

async function localReconnect(roomId, conn) {
  const room = localRooms[roomId];
  if (!room) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
    return;
  }
  if (room.conn) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'Room has active socket connection' }));
    return ;
  }
  room.conn = conn;
  room.connected = true;
  conn.socket.send(JSON.stringify({ type: 'reconnected', roomId }));
}

async function localStart(roomId, conn) {
  const room = localRooms[roomId];
  if (!room || room.gameStarted) return;
  if (room.conn.socket != conn.socket) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'Room mismatch' }));
    return ;
  }
  room.connected = true;
  room.gameStarted = true;
  
  console.log(`Starting game in room ${roomId}`);
  conn.socket.send(JSON.stringify({ type: 'game_start' })); 
  room.gameLoopInterval = setInterval(async () => {
    updateGame(room.game);
    if (room.game.player1Score >= 11 || room.game.player2Score >= 11) {
      if (room.game.player1Score > room.game.player2Score &&
        room.game.player1Score - room.game.player2Score >= 2) {
        clearInterval(room.gameLoopInterval);
        if (room.conn && room.conn.socket.readyState === 1) {
          room.conn.socket.send(JSON.stringify({
            type: 'game_over',
            winner: { id: 1 },
          }));
          room.conn.socket.close();
        }
        delete localRooms[roomId];
      }
      else if (room.game.player2Score > room.game.player1Score &&
        room.game.player2Score - room.game.player1Score >= 2) {
        clearInterval(room.gameLoopInterval);
        if (room.conn && room.conn.socket.readyState === 1) {
          room.conn.socket.send(JSON.stringify({
            type: 'game_over',
            winner: { id: 2 },
          }));
          room.conn.socket.close();
        }
        delete localRooms[roomId];
      }
    }
    if (room.conn && room.conn.socket.readyState === 1) {
      room.conn.socket.send(JSON.stringify({ type: "game_tick", state: room.game }));
    }
  }, FRAME_RATE);
}


//Room handling below

async function handleAutoJoin(conn, playerId) {
  //check for reconnection of disconnected users
  const existingRoomId = Object.keys(rooms).find(rid =>
    rooms[rid].players.find(p => p.id === playerId)
  );
  
  if (existingRoomId) {
    const room = rooms[existingRoomId];
    const player = room.players.find(p => p.id === playerId);
    if (player.conn === null) {
      player.conn = conn;
      player.conn.socket.send(JSON.stringify({ type: 'reconnected', roomId: existingRoomId, paddleNumber: player.paddleNumber }));
      return;
    } else {
      try {
        conn.socket.send(JSON.stringify({ type: 'error', message: 'Player has active game session.' }));
        conn.socket.close();
      } catch (err) {
        console.error('Failed to close duplicate connection from same user:', err);
      }
      return;
    }
  }
  let roomId, room, paddleNumber;
  //find existing room with one player
  await roomMutex.runExclusive(() => {
    roomId = Object.keys(rooms).find(rid =>
      rooms[rid].players.length <= 1 && !rooms[rid].gameStarted
    );

    if (!roomId) {
      roomId = uuidv4();
      rooms[roomId] = { players: [], ready: new Set(), gameStarted: false, game: createGame() };
    }

    room = rooms[roomId];
    if (room.players.find(p => p.id === playerId)) {
      conn.socket.send(JSON.stringify({ type: 'error', message: 'Player already joined' }));
      return;
    }

    paddleNumber = room.players.length === 0 ? 1 : 2;
    if (room.players.length >= 2) {
      conn.socket.send(JSON.stringify({ type: 'error', message: 'Room full' }));
      return;
    }
    room.players.push({ id: playerId, conn, paddleNumber });

  }).catch(err => {
    console.error('Error in handleAutoJoin:', err);
  });
  conn.socket.send(JSON.stringify({ type: 'joined', roomId, paddleNumber }));

  if (room.players.length === 2) {
    room.players.forEach(p => {
      p.conn.socket.send(JSON.stringify({ type: 'waiting_ready', roomId }));
    });
  }
}

async function handleReady(roomId, playerId, conn) {
  const room = rooms[roomId];
  if (!room || room.gameStarted) return;
  await readyMutex.runExclusive(() => {
    const playerInRoom = room.players.some(p => p.id === playerId);
    if (playerInRoom) {
      room.ready.add(playerId);
    }
  });
  if (conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'ready_ack', roomId, playerId, status: 'ok' }));
  }
  if (room.ready.size === 2) {
    room.gameStarted = true;
    startGame(roomId);
  }
}

async function getNick(uid)
{
    const res = await fetch(`http://database:3443/api/users/${uid}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const error = await res.json();
      console.log(`Error getting nickname: ${error.error || "Unknown error"}`);
      return 'null';
    }
    const user = await res.json();
    if (user && user.nickname)
      return user.nickname;
    else
      return 'null';
}

function startGame(roomId) {
  const room = rooms[roomId];
  console.log(`Starting game in room ${roomId}`);

  room.players.forEach(p => {
    if (p.conn && p.conn.socket.readyState === 1) {
      p.conn.socket.send(JSON.stringify({ type: 'game_start' }));
    }
  });

  room.gameLoopInterval = setInterval(async () => {
      updateGame(room.game);
      if (room.game.player1Score >= 11 || room.game.player2Score >= 11) {
        if (room.game.player1Score > room.game.player2Score &&
          room.game.player1Score - room.game.player2Score >= 2) {
          clearInterval(room.gameLoopInterval);
          const winner = room.players.find(player => player.paddleNumber === 1);
          const loser = room.players.find(player => player.paddleNumber === 2);
          const winnernick = await getNick(winner.id);
          room.players.forEach(p => {
            if (p.conn && p.conn.socket.readyState === 1) {
              p.conn.socket.send(JSON.stringify({
                type: 'game_over',
                winner: { id: winner.id , name: winnernick },
              }));
            }
          });
          const res = await fetch(`http://database:4334/api/updateResult`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ winId: winner.id, lossId: loser.id, game: 'pong' })
          });
          if (!res.ok) {
            const error = await res.json();
            console.log(`Error updating result: ${error.error || "Unknown error"}`);
          }
          room.players.forEach(p => {if (p.conn && p.conn.socket.readyState === 1) {p.conn.socket.close()}});
          delete rooms[roomId];
        }
        else if (room.game.player2Score > room.game.player1Score &&
          room.game.player2Score - room.game.player1Score >= 2) {
          clearInterval(room.gameLoopInterval);
          const winner = room.players.find(player => player.paddleNumber === 2);
          const loser = room.players.find(player => player.paddleNumber === 1);
          const winnernick = await getNick(winner.id);
          room.players.forEach(p => {
            if (p.conn && p.conn.socket.readyState === 1) {
              p.conn.socket.send(JSON.stringify({
                type: 'game_over',
                winner: { id: winner.id, name: winnernick },
              }));
            }
          });
          const res = await fetch(`http://database:4334/api/updateResult`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ winId: winner.id, lossId: loser.id, game: 'pong' })
          });
          if (!res.ok) {
            const error = await res.json();
            console.log(`Error updating result: ${error.error || "Unknown error"}`);
          }
          room.players.forEach(p => {if (p.conn && p.conn.socket.readyState === 1) {p.conn.socket.close()}});
          delete rooms[roomId];
        }
      }
      room.players.forEach(p => {
        if (p.conn && p.conn.socket.readyState === 1) {
          p.conn.socket.send(JSON.stringify({ type: "game_tick", state: room.game }));
        }
      });
  }, FRAME_RATE);

};

fastify.addHook('onClose', async (instance, done) => {
  for (const roomId in rooms) {
    clearInterval(rooms[roomId].gameLoopInterval);
  }
  for (const roomId in localRooms) {
    clearInterval(localRooms[roomId].gameLoopInterval);
  }
  for (const roomId in aiRooms) {
    clearInterval(aiRooms[roomId].gameLoopInterval);
  }
  done();
});

fastify.listen({ port: 3330, host: '0.0.0.0' }, () => {
  console.log('Server listening on http://localhost:3330');
  setInterval(() => {
    for (const [roomId, room] of Object.entries(rooms)) {
      const allDisconnected = room.players.every(
        p => !p.conn || p.conn.socket.readyState !== 1
      );

      if (allDisconnected) {
        console.log(`Cleaning up room ${roomId} (all players disconnected)`);

        if (room.gameLoopInterval) {
          clearInterval(room.gameLoopInterval);
        }

        room.players.forEach(p => {
          try {
            p.conn?.socket?.close();
          } catch (_) {}
        });

        delete rooms[roomId];
      }
    }

    for (const [roomId, room] of Object.entries(localRooms)) {
      if (room.connected === false && Date.now() - room.lastActive > 2 * 60 * 1000) {
        console.log(`Cleaning up room ${roomId}`);

        if (room.gameLoopInterval) {
          clearInterval(room.gameLoopInterval);
        }
        delete localRooms[roomId];
      }
    }

    for (const [roomId, room] of Object.entries(aiRooms)) {
      if (room.connected === false && Date.now() - room.lastActive > 2 * 60 * 1000) {
        console.log(`Cleaning up room ${roomId}`);

        if (room.gameLoopInterval) {
          clearInterval(room.gameLoopInterval);
        }
        delete aiRooms[roomId];
      }
    }

  }, 5 * 60 * 1000); //remove abandoned rooms every 5 minutes
});
