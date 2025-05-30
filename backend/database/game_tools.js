
const VALID_GAMES = ["pong"];

export function addGameWin(db, userId, game) {
	if (!VALID_GAMES.includes(game)) throw new Error("Invalid game");

	const query = `UPDATE users SET ${game}_wins = ${game}_wins + 1 WHERE id = ?`;

	return new Promise((resolve, reject) => {
		db.run(query, [userId], function (err) {
			if (err) return reject(err);
			resolve(this.changes);
		});
	});
}

export function addGameLoss(db, userId, game) {
	if (!VALID_GAMES.includes(game)) throw new Error("Invalid game");

	const query = `UPDATE users SET ${game}_losses = ${game}_losses + 1 WHERE id = ?`;

	return new Promise((resolve, reject) => {
		db.run(query, [userId], function (err) {
			if (err) return reject(err);
			resolve(this.changes);
		});
	});
}



//code to call add game win and add game loss. No functions are using them at this moment
//{
//	try {
//			await addGameWin(db, winner, game);
//			await addGameLoss(db, loser, game);
//	} catch (err) {
//		console.error(err);
//	}
//}