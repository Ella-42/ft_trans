import jwt from 'jsonwebtoken';

import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { Mutex } from 'async-mutex';
import cookie from 'cookie';
import cookiePlugin from '@fastify/cookie';
const roomMutex = new Mutex();
const readyMutex = new Mutex();
const TournamentMutex = new Mutex();
const updateTournamentMutex = new Mutex();
const oripublicKey = process.env.PUBLIC_KEY;
if (!oripublicKey) {
  throw new Error("Missing PUBLIC_KEY environment variable");
}
const publicKey = oripublicKey.replace(/\\n/g, '\n');


const fastify = Fastify();
fastify.register(websocket);

await fastify.register(cookiePlugin, {
  secret: process.env.COOKIE_SECRET,
  parseOptions: {}
});


const rooms = {}; // format: { roomId: { players: [{ id, conn, paddleNumber }], ready: Set, gameStarted: bool, game[{....}], gameLoopInterval, gameOver: bool, tournament: bool, tid: int, round: int } }

const localRooms = {}; // format: { roomId: { conn, connected: bool, gameStarted: bool, game[{....}], gameLoopInterval, lastActive: time } }

const aiRooms = {}; // format: { roomId: { conn, connected: bool, gameStarted: bool, game[{....}], gameLoopInterval, lastActive: time, paddle: 1/2 , aiHasStartedMoving: bool, game.aiReactionTime: time } }

const tournaments = {}; //format: { [tRoomId]: { players: [{ id, conn }], numPlayers: int, totalPlayer: int, ready: Set, currentRound: int, tournamentStarted: bool, rounds: [{roundNumber: int, ended: int, startedMatches: int, matches: [{matchId: int, ended: bool, error: bool, winner: int, loser: int}] }] } }

function findRoomByPlayerId(playerId) {
  for (const [roomId, room] of Object.entries(rooms)) {
    if (room.players.some(player => player.id === playerId)) {
      return room;
    }
  }
  return null;
}

function findTRoomByPlayerId(playerId) {
  for (const [roomId, room] of Object.entries(tournaments)) {
    if (room.players.some(player => player.id === playerId)) {
      return room;
    }
  }
  return null;
}

fastify.get('/ws/local', { websocket: true }, async (conn, req) => {
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
          localRooms[rid].conn && localRooms[rid].conn.socket === conn.socket);
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
  });
});


fastify.get('/ws/ai', { websocket: true }, async (conn, req) => {
  conn.socket.on('message', async (message) => {
    try {
      const msg = JSON.parse(message.toString());
      if (typeof msg !== 'object' || typeof msg.type !== 'string') return;

      const { type, roomId } = msg;
      if (type === 'ai') {
        await handleAi(conn);
      } else if (type === 'aiReadyLeft') {
        await aiStart(roomId, conn, 1);
      } else if (type === 'aiReadyRight') {
        await aiStart(roomId, conn, 2);
      } else if (type === 'aiReconnect') {
        await aiReconnect(roomId, conn);
      } else if (type === 'aiMove') {
        const airoomid = Object.keys(aiRooms).find(rid =>
          aiRooms[rid].conn && aiRooms[rid].conn.socket === conn.socket);
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
      }
    } catch (err) {
      console.error('Message error:', err);
    }
  });

  conn.socket.on('close', () => {
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
  });
});


fastify.get('/ws', { websocket: true }, async (conn, req) => {
  conn.socket.on('message', async (message) => {
    try {
      const msg = JSON.parse(message.toString());
      if (typeof msg !== 'object' || typeof msg.type !== 'string') return;

      const { type, roomId } = msg;
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

      if (type === 'auto_join') {
        await handleAutoJoin(conn, conn.userId);
      } else if (type === 'tournament') {
        await handleTournament(conn, conn.userId);
      } else if (type === 'ready') {
        await handleReady(roomId, conn.userId, conn);
      } else if (type === 'move') {
        const room = findRoomByPlayerId(conn.userId);
        if (!room) return;
        const sender = room.players.find(player => player.conn === conn);
        if (!sender) return;

        const paddle = sender.paddleNumber === 1 ? room.game.paddle1 : room.game.paddle2;

        if (msg.direction === "up" && paddle.y > 0) {
          paddle.y -= PADDLE_SPEED;
        } else if (msg.direction === "down" && paddle.y < GAME_HEIGHT - paddle.height) {
          paddle.y += PADDLE_SPEED;
        }
      } else if (type === 'waitNextT') {
        if (!msg.tRoomId) {
          if (conn?.socket?.readyState === 1) {
            conn.socket.send(JSON.stringify({ type: 'error', message: 'Invalid request' }));
          }
        }
        await waitNextTournament(conn, conn.userId, msg.tRoomId);
      }
    } catch (err) {
      console.error('Message error:', err);
    }
  });

  conn.socket.on('close', () => {
    const room = findRoomByPlayerId(conn.userId);
    const tRoom = findTRoomByPlayerId(conn.userId);

    if (room && tRoom) {
      const tPlayer = tournaments[room.tid].players.find(p => p.id === conn.userId);
      if (tPlayer?.conn?.socket === conn.socket) {
        tPlayer.conn = null;
      }
    }
    if (room) {
      const player = room.players.find(p => p.id === conn.userId);
      if (player?.conn?.socket != conn.socket) {
        return ;
      }
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
      } else {
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
const PADDLE_SPEED = 18;

function createGame() {
    let ballSpeed = 3; // if level needs to be implemented, this variable should be changed
    const ballXDirection = Math.random() < 0.5 ? 1 : -1;
    let ballYDirection;
    do {
      ballYDirection = (Math.random() - 0.5) * 2; // range: [-1, 1]
    } while (Math.abs(ballYDirection) < 0.2); // avoid almost horizontal direction

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

//Tournament Handling
async function createTournamentMatches(tRoom, players, tRoomId) {
  await roomMutex.runExclusive(() => {
      let i = 0;
      if (!tRoom.rounds[tRoom.currentRound]) {
        tRoom.rounds[tRoom.currentRound] = {roundNumber: tRoom.currentRound, ended: 0, startedMatches: 0, matches: []};
      }
      tRoom.tournamentStarted = true;
      while (i < players.length) {
        let matchId = uuidv4();
        if (!players[i + 1]) {
          tRoom.rounds[tRoom.currentRound].matches.push({matchId: matchId, ended: true, error: false, winner: players[i].id, loser: 0});
          tRoom.rounds[tRoom.currentRound].ended += 1;
        } else {
          tRoom.rounds[tRoom.currentRound].matches.push({matchId: matchId, ended: false, error: false, winner: 0, loser: 0, player1Id: players[i].id, player2Id: players[i+1].id});
          rooms[matchId] = { players: [], ready: new Set(), gameStarted: false, game: createGame(), gameOver: false, tournament: true, tid : tRoomId, round: tRoom.currentRound};
          rooms[matchId].players.push({ id: players[i].id, conn: players[i].conn, paddleNumber: 1 });
          i++;
          rooms[matchId].players.push({ id: players[i].id, conn: players[i].conn, paddleNumber: 2 });
          rooms[matchId].players.forEach(p => {
            if (p.conn?.socket?.readyState === 1) {
              p.conn.socket.send(JSON.stringify({ type: 'waiting_t_ready', tRoomId, matchId, paddleNumber: p.paddleNumber }));
            }
          });
        }
        i++;
        tRoom.rounds[tRoom.currentRound].startedMatches += 1;
      }
  }).catch(err => {
      console.error('Error in Tournament new match creation:', err);
  });
}

async function checkNextRound(tRoomId){
  await updateTournamentMutex.runExclusive(async () => {
    let tRoom = tournaments[tRoomId];
    if (!tRoom) return;
    let lastRound = tRoom.currentRound;
    let winnerlist = [];

    if (tRoom.rounds[lastRound].ended === tRoom.rounds[lastRound].startedMatches) {
      for (const match of tRoom.rounds[lastRound].matches) {
        const winnerId = match.winner;
        if (winnerId != 0) {
          const winnerNick = await getNick(winnerId);
          winnerlist.push({ id: winnerId, nick: winnerNick });
        }
      }

      if (winnerlist.length === 1) {
        let winnerId = winnerlist[0].id;
        let winnernick = winnerlist[0].nick;
        let loserlist = [];

        for (let i = 0; i < tRoom.players.length; i++) {
          if (tRoom.players[i].id != winnerId) {
            loserlist.push(tRoom.players[i].id);
          }
        }
        const res = await fetch(`http://database:4334/api/updateTResult`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ winId: winnerId, loserlist: loserlist, game: 'pong' })
        });
        if (!res.ok) {
          const error = await res.json();
          console.log(`Error updating result: ${error.error || "Unknown error"}`);
        }
        tRoom.players.forEach(p => {
          if (p.conn?.socket?.readyState === 1) {
            p.conn.socket.send(JSON.stringify({ type: 'tournamentOver', winner: { id: winnerId , name: winnernick }}));
          }
        });
        delete tournaments[tRoomId];
        return ;
      }
    
      tRoom.players.forEach(p => {
        if (p.conn?.socket?.readyState === 1) {
          p.conn.socket.send(JSON.stringify({ type: 'Roundwinner', winnerlist: winnerlist}));
        }
      });
      let newPlayerList = [];
      tRoom.rounds[lastRound].matches.forEach(match => {
        const winnerId = match.winner;
        const conn = tRoom.players.find(p => p.id === winnerId)?.conn ?? null;
        newPlayerList.push({ id: winnerId, conn: conn });
      });
      tRoom.currentRound++;
      await createTournamentMatches(tRoom, newPlayerList, tRoomId);
      let winnerIds = winnerlist.map(w => w.id);
      let nonWinners = tRoom.players.filter(p => !winnerIds.includes(p.id));
      nonWinners.forEach(p => {
        if (p.conn?.socket?.readyState === 1) {
          p.conn.socket.send(JSON.stringify({ type: 'requestNewWait'}));
        }
      });
    }
  });
}

async function waitNextTournament(conn, userId, tRoomId) {
  let tRoom = tournaments[tRoomId];
  if (!tRoom) {
    if (conn?.socket?.readyState === 1) {
      conn.socket.send(JSON.stringify({ type: 'error', message: 'Tournament room does not exist' }));
    }
    return ;
  }
  const sender = tRoom.players.find(player => player.conn === conn);
  if (!sender) {
    if (conn?.socket?.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'You are not in the specified tournament' }));
    }
    return ;
  }
  let tUpdateInt = setInterval(async () => {
    if (!conn || !conn.socket || conn.socket.readyState != 1){
      clearInterval(tUpdateInt);
      return;
    }
    
    let tRoom = tournaments[tRoomId];
    if (!tRoom) {
      clearInterval(tUpdateInt);
      return;
    }
    
    // Stop sending updates if the round ended
    if (tRoom.rounds[tRoom.currentRound].ended >= tRoom.rounds[tRoom.currentRound].startedMatches) {
      clearInterval(tUpdateInt);
      return;
    }
    
    let updates = [];
    for (let match of tRoom.rounds[tRoom.currentRound].matches) {
      let status;
      let p1 = null;
      let p2 = null;
      let score = null;

      if (rooms[match.matchId]) {
        let room = rooms[match.matchId];
        let p1Id = match.player1Id;
        let p2Id = match.player2Id;
        p1 = { id: p1Id, name: await getNick(p1Id) };
        p2 = { id: p2Id, name: await getNick(p2Id) };
        score = {
          player1: room.game.player1Score,
          player2: room.game.player2Score
        };
        status = room.gameStarted ? 'in_progress' : 'waiting';
      } else if (match.ended) {
        let p1Id = match.player1Id;
        let p2Id = match.player2Id;
        let p1name = p1Id ? await getNick(p1Id) : 'TBD';
        let p2name = p2Id ? await getNick(p2Id) : 'TBD';
        p1 = { id: p1Id, name: p1name };
        p2 = { id: p2Id, name: p2name };
        score = match.finalScore
          ? { player1: match.finalScore.player1, player2: match.finalScore.player2 }
          : { player1: '?', player2: '?' }
        status = 'finished';
      } else {
        status = 'waiting';
      }
      
      updates.push({
        matchId: match.matchId,
        status,
        players: [p1, p2],
        score
      });
    }
    
    // Send update to the waiting client
    conn.socket.send(JSON.stringify({
      type: 'tournament_status',
      tRoomId,
      round: tRoom.currentRound,
      matches: updates
    }));
  
  }, 3000); // every 3 seconds
}

async function handleTournament(conn, playerId) {
  //check for reconnection of disconnected users
  const existingTournament = Object.keys(tournaments).find(rid =>
    tournaments[rid].players.find(p => p.id === playerId)
  );
  

  if ( existingTournament ) {
    const room = tournaments[existingTournament];
    const player = room.players.find(p => p.id === playerId);
    if ( player.conn === null ) {
      player.conn = conn;
      if ( player.conn && player.conn.socket.readyState === 1 ) {
        player.conn.socket.send(JSON.stringify({ type: 'tReconnected', tRoomId: existingTournament }));
      }
      if ( room.tournamentStarted ) {
        for (let match of room.rounds[room.currentRound].matches) {
          if ( match.matchId && rooms[match.matchId] ) {
            const mPlayer = rooms[match.matchId].players.find(p => p.id === playerId);
            if ( mPlayer ) {
              mPlayer.conn = conn;
              if ( mPlayer.conn && mPlayer.conn.socket.readyState === 1 ) {
                mPlayer.conn.socket.send(JSON.stringify({ type: 'reconnected', matchId: match.matchId, paddleNumber: mPlayer.paddleNumber }));
              }
              return ;
            }
          }
        }
        if (player.conn?.socket?.readyState === 1) {
          player.conn.socket.send(JSON.stringify({ type: 'requestNewWait'}));
        }
      }
      return;
    } else {
      try {
        if ( conn && conn.socket.readyState === 1) {
          conn.socket.send(JSON.stringify({ type: 'error', message: 'Player has active tournament session.' }));
          conn.socket.close();
        }
      } catch (err) {
        console.error('Failed to close duplicate connection from same user:', err);
      }
      return;
    }
  }
  let tRoomId, tRoom;
  const playernumber = 4;
  //find existing non-full room with some players
  await TournamentMutex.runExclusive(() => {
    tRoomId = Object.keys(tournaments).find(rid =>
      tournaments[rid].players.length < playernumber && !tournaments[rid].tournamentStarted && tournaments[rid].totalPlayers === playernumber
    );

    if (!tRoomId) {
      tRoomId = uuidv4();
      tournaments[tRoomId] = { players: [], numPlayers: playernumber, totalPlayers: playernumber, ready: new Set(), currentRound: 1, tournamentStarted: false, rounds: []};
    }

    tRoom = tournaments[tRoomId];
    if (tRoom.players.find(p => p.id === playerId) && conn && conn.socket.readyState === 1) {
      conn.socket.send(JSON.stringify({ type: 'error', message: 'Player already joined active session' }));
      return;
    }
    if (tRoom.players.length >= tRoom.numPlayers && conn && conn.socket.readyState === 1) {
      conn.socket.send(JSON.stringify({ type: 'error', message: 'Room full' }));
      return;
    }
    tRoom.players.push({ id: playerId, conn });
    if (conn && conn.socket.readyState === 1) {
      conn.socket.send(JSON.stringify({ type: 'joinedTRoom', tRoomId }));
    }

  }).catch(err => {
    console.error('Error in handleTournament:', err);
  });

  if (tRoom && tRoom.players.length === tRoom.totalPlayers) {
    await createTournamentMatches(tRoom, tRoom.players, tRoomId);
  }
}

//AI Handling

function updateAi(game, playerPaddle) {
  const aiPaddle = playerPaddle === 1 ? game.paddle2 : game.paddle1;
  const aiSpeed = 9;

  if (!game.aiReactionTime) game.aiReactionTime = Date.now();
  if (!game.aiHasStartedMoving && Math.abs(aiPaddle.y + aiPaddle.height / 2 - game.ballY) > 10) {
    game.aiReactionTime = Date.now(); // start delay
    game.aiHasStartedMoving = true;
  }

  const now = Date.now();
  const delay = 284; // 284 milliseconds is average human reaction time, for fair competition

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
  /*
  let existingRoomId = Object.keys(localRooms).find(rid =>
    localRooms[rid].conn && localRooms[rid].conn.socket === conn.socket);
  if (existingRoomId) {
    const room = localRooms[existingRoomId];
    if (room.gameLoopInterval) {
      clearInterval(room.gameLoopInterval);
    }
    if (room.conn) {
      room.conn.socket.close();
    }
    delete localRooms[roomId];
  }
  existingRoomId = Object.keys(aiRooms).find(rid =>
    aiRooms[rid].conn && aiRooms[rid].conn.socket === conn.socket);
  if (existingRoomId) {
    const room = aiRooms[existingRoomId];
    if (room.gameLoopInterval) {
      clearInterval(room.gameLoopInterval);
    }
    if (room.conn) {
      room.conn.socket.close();
    }
    delete aiRooms[roomId];
  } */
  let roomId;
  roomId = uuidv4();
  aiRooms[roomId] = { conn: conn, connected: true, gameStarted: false, game: createGame(), lastActive: Date.now() };
  if (conn && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'waiting_ready', roomId }));
  }
}

async function aiReconnect(roomId, conn) {
  const room = aiRooms[roomId];
  if (!room && conn && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
    return;
  }
  if (room.conn && conn && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'Room has active socket connection' }));
    return ;
  }
  room.conn = conn;
  room.connected = true;
  if (conn && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'reconnected', roomId }));
  }
}

async function aiStart(roomId, conn, paddle) {
  const room = aiRooms[roomId];
  if (!room || room.gameStarted) return;
  if (room.conn.socket != conn.socket && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'Room mismatch' }));
    return ;
  }
  room.paddle = paddle;
  room.connected = true;
  room.gameStarted = true;
  
  console.log(`Starting game in room ${roomId}`);
  if (conn && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'game_start' }));
  }
  room.gameLoopInterval = setInterval(async () => {
    updateGame(room.game);
    updateAi(room.game, paddle);
    if (room.conn && room.conn.socket.readyState === 1) {
      room.conn.socket.send(JSON.stringify({ type: "game_tick", state: room.game }));
    }
    if ((room.game.player1Score >= 11 && room.game.player1Score - room.game.player2Score >= 2)
	|| (room.game.player2Score >= 11 && room.game.player2Score - room.game.player1Score >= 2)) {
      clearInterval(room.gameLoopInterval);
      let result;
      if (room.game.player1Score > room.game.player2Score) {
        result = paddle === 1 ? 1 : 0;
      }
      else if (room.game.player2Score > room.game.player1Score) {
        result = paddle === 2 ? 1 : 0;
      }
      if (room.conn && room.conn.socket.readyState === 1) {
        room.conn.socket.send(JSON.stringify({
          type: 'game_over',
          result: { win: result },
        }));
        room.conn.socket.close();
      }
      delete aiRooms[roomId];
    }
  }, FRAME_RATE);
}


//Local Game handling


async function handleLocal(conn) {
  /*
  let existingRoomId = Object.keys(localRooms).find(rid =>
    localRooms[rid].conn && localRooms[rid].conn.socket === conn.socket);
  if (existingRoomId) {
    const room = localRooms[existingRoomId];
    if (room.gameLoopInterval) {
      clearInterval(room.gameLoopInterval);
    }
    if (room.conn) {
      room.conn.socket.close();
    }
    delete localRooms[roomId];
  }
  existingRoomId = Object.keys(aiRooms).find(rid =>
    aiRooms[rid].conn && aiRooms[rid].conn.socket === conn.socket);
  if (existingRoomId) {
    const room = aiRooms[existingRoomId];
    if (room.gameLoopInterval) {
      clearInterval(room.gameLoopInterval);
    }
    if (room.conn) {
      room.conn.socket.close();
    }
    delete aiRooms[roomId];
  } */
  let roomId;
  roomId = uuidv4();
  localRooms[roomId] = { conn: conn, connected: true, gameStarted: false, game: createGame(), lastActive: Date.now() };
  if (conn && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'waiting_ready', roomId }));
  }
}

async function localReconnect(roomId, conn) {
  const room = localRooms[roomId];
  if (!room && conn && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
    return;
  }
  if (room.conn && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'Room has active socket connection' }));
    return ;
  }
  room.conn = conn;
  room.connected = true;
  if ( conn && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'reconnected', roomId }));
  }
}

async function localStart(roomId, conn) {
  const room = localRooms[roomId];
  if (!room || room.gameStarted) return;
  if (room.conn.socket != conn.socket && conn && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'error', message: 'Room mismatch' }));
    return ;
  }
  room.connected = true;
  room.gameStarted = true;
  
  console.log(`Starting game in room ${roomId}`);
  if ( conn && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'game_start' })); 
  }
  room.gameLoopInterval = setInterval(async () => {
    updateGame(room.game);
    if (room.conn && room.conn.socket.readyState === 1) {
      room.conn.socket.send(JSON.stringify({ type: "game_tick", state: room.game }));
    }
    if ((room.game.player1Score >= 11 && room.game.player1Score - room.game.player2Score >= 2)
	|| (room.game.player2Score >= 11 && room.game.player2Score - room.game.player1Score >= 2)) {
      clearInterval(room.gameLoopInterval);
	  let winnerId;
      if (room.game.player1Score > room.game.player2Score) {
		winnerId = 1;
      }
      else if (room.game.player2Score > room.game.player1Score) {
		winnerId = 2;
      }
      if (room.conn && room.conn.socket.readyState === 1) {
        room.conn.socket.send(JSON.stringify({
          type: 'game_over',
          winner: { id: winnerId },
        }));
        room.conn.socket.close();
      }
      delete localRooms[roomId];
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
      if (room.tournament === true) {
        if ( conn && conn.socket.readyState === 1) {
          conn.socket.send(JSON.stringify({ type: 'error', message: 'Player has ongoing tournament.' }));
          conn.socket.close();
        }
        return ;
      }
      player.conn = conn;
      if ( player.conn && player.conn.socket.readyState === 1 ) {
        player.conn.socket.send(JSON.stringify({ type: 'reconnected', roomId: existingRoomId, paddleNumber: player.paddleNumber }));
      }
      return;
    } else {
      try {
        if ( conn && conn.socket.readyState === 1) {
          conn.socket.send(JSON.stringify({ type: 'error', message: 'Player has active game session.' }));
          conn.socket.close();
        }
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
      rooms[roomId] = { players: [], ready: new Set(), gameStarted: false, game: createGame(), gameOver: false, tournament: false, tid : null };
    }

    room = rooms[roomId];
    if (room.players.find(p => p.id === playerId) && conn && conn.socket.readyState === 1) {
      conn.socket.send(JSON.stringify({ type: 'error', message: 'Player already joined' }));
      return;
    }

    paddleNumber = room.players.length === 0 ? 1 : 2;
    if (room.players.length >= 2 && conn && conn.socket.readyState === 1) {
      conn.socket.send(JSON.stringify({ type: 'error', message: 'Room full' }));
      return;
    }
    room.players.push({ id: playerId, conn, paddleNumber });

  }).catch(err => {
    console.error('Error in handleAutoJoin:', err);
  });
  if (conn && conn.socket.readyState === 1) {
    conn.socket.send(JSON.stringify({ type: 'joined', roomId, paddleNumber }));
  }
  if (room.players.length === 2) {
    room.players.forEach(p => {
      if (p.conn?.socket?.readyState === 1) {
        p.conn.socket.send(JSON.stringify({ type: 'waiting_ready', roomId }));
      }
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
    const res = await fetch(`http://database:4334/api/users/${uid}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const error = await res.json();
      console.log(`Error getting nickname: ${error.error || "Unknown error"}`);
      return 'anonymous';
    }
    const user = await res.json();
    if (user && user.nickname)
      return user.nickname;
    else
      return 'anonymous';
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
      room.players.forEach(p => {
        if (p.conn && p.conn.socket.readyState === 1) {
          p.conn.socket.send(JSON.stringify({ type: "game_tick", state: room.game }));
        }
      });
      if (!room.gameOver && ((room.game.player1Score >= 11 && room.game.player1Score - room.game.player2Score >= 2)
		|| (room.game.player2Score >= 11 && room.game.player2Score - room.game.player1Score >= 2))) {
        room.gameOver = true;
        clearInterval(room.gameLoopInterval);
		let winner, loser;
        if (room.game.player1Score > room.game.player2Score) {
          winner = room.players.find(player => player.paddleNumber === 1);
          loser = room.players.find(player => player.paddleNumber === 2);
        }
        else if (room.game.player2Score > room.game.player1Score) {
          winner = room.players.find(player => player.paddleNumber === 2);
          loser = room.players.find(player => player.paddleNumber === 1);
        }
        const winnernick = await getNick(winner.id);
        room.players.forEach(p => {
          if (p.conn && p.conn.socket.readyState === 1) {
            p.conn.socket.send(JSON.stringify({
              type: 'game_over',
              winner: { id: winner.id, name: winnernick },
            }));
          }
        });
        if (room.tournament) {
          await updateTournamentMutex.runExclusive(() => {
            tournaments[room.tid].rounds[room.round].ended += 1;
            tournaments[room.tid].numPlayers -= 1;
          });
          const match = tournaments[room.tid].rounds[room.round].matches.find(
            m => m.matchId === roomId
          );
          
          if (match) {
            match.winner = winner.id;
            match.loser = loser.id;
            match.ended = true;
            match.status = 'finished';
            match.finalScore = {
              player1: room.game.player1Score,
              player2: room.game.player2Score,
            };
          }
          const tRoom = tournaments[room.tid];
          const roundObj = tRoom.rounds[room.round];
          const updates = [];
          for (const m of roundObj.matches) {
            let status = m.status || (m.ended ? 'finished' : 'in_progress');
            let p1 = m.player1Id ? { id: m.player1Id, name: await getNick(m.player1Id) } : null;
            let p2 = m.player2Id ? { id: m.player2Id, name: await getNick(m.player2Id) } : null;
            let score = m.finalScore
              ? { player1: m.finalScore.player1, player2: m.finalScore.player2 }
              : { player1: '?', player2: '?' };
            updates.push({
              matchId: m.matchId,
              status,
              players: [p1, p2],
              score
            });
          }
          for (const p of tRoom.players) {
            if (p.conn?.socket?.readyState === 1) {
              p.conn.socket.send(JSON.stringify({
                type: 'tournament_status',
                tRoomId: room.tid,
                round: tRoom.currentRound,
                matches: updates
              }));
            }
          }
        }
        const res = await fetch(`http://database:4334/api/updateResult`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
		  body: JSON.stringify({ winId: winner.id, lossId: loser.id, game: 'pong', info: `${room.game.player1Score}-${room.game.player2Score}` })
        });
        if (!res.ok) {
          const error = await res.json();
          console.log(`Error updating result: ${error.error || "Unknown error"}`);
        }
        if (room.tournament) {
          const round = tournaments[room.tid].rounds[room.round];
          const match = round.matches.find(m => m.matchId === roomId);
          if (match) {
            match.winner = winner.id;
            match.loser = loser.id;
            match.ended = true;
            match.finalScore = {
              player1: room.game.player1Score,
              player2: room.game.player2Score,
            };
          }
          await checkNextRound(room.tid);
        } else {
          room.players.forEach(p => {if (p.conn && p.conn.socket.readyState === 1) {p.conn.socket.close()}});
        }
        delete rooms[roomId];
      }
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
        if (room.tournament === true) {
          tournaments[room.tid].rounds[room.round].ended += 1;
          const match = tournaments[room.tid].rounds[room.round].matches.find(
            m => m.matchId === roomId
          );
          if (match) {
            match.winner = 0;
            match.loser = 0;
            match.ended = true;
            match.error = true;
          }
        }
        room.players.forEach(p => {
          try {
            p.conn?.socket?.close();
          } catch (_) {}
        });

        delete rooms[roomId];
      }
    }

    for (const [roomId, room] of Object.entries(tournaments)) {
      const allDisconnected = room.players.every(
        p => !p.conn || p.conn.socket.readyState !== 1
      );

      if (allDisconnected) {
        console.log(`Cleaning up tournament ${roomId} (all players disconnected)`);

        room.players.forEach(p => {
          try {
            p.conn?.socket?.close();
          } catch (_) {}
        });

        delete tournaments[roomId];
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
