import mysql2 from "mysql2";
import dotenv from "dotenv";

///load env variables
dotenv.config();

///Setup db connection pool
const pool = mysql2.createPool({
    host: process.env.mySQL_Host,
    user: process.env.mySQL_User,
    password: process.env.mySQL_Password,
    database: process.env.mySQL_Database
}).promise();


///Create user
export async function createUser(username, password) {
    try {
        const [r1] = await pool.execute("SELECT user_id FROM users WHERE username = ?", [username]);
        if (r1.length > 0) {
            console.warn(`Username "${username}" already exists.`);
            return null; 
        } else {
        const [result] = await pool.execute("INSERT INTO users (username, password, highest_score, win_count) VALUES (?, ?, ?, ?)", [username, password, 0, 0]);
        return result.insertId;
        }
    }   catch (err) {
        console.error("Unexpected DB error:", err);
        throw err;
    }
}

///Verify user login
export async function isValidUser(username, password) {
    const [result] = await pool.execute("SELECT user_id FROM users WHERE username = ? AND password = ?", [username, password]);
    return result.length > 0 ? result[0].user_id : null;
}

///Get user highscore
export async function getUserHighScore(username) {
    const [rows] = await pool.execute(`SELECT MAX(p.score) AS personal_best FROM participants p JOIN users u ON u.user_id = p.user_id WHERE u.username = ?`, [username]);
    if (rows.length > 0) {
        return rows[0].personal_best;
    } else {
        return null;
    }
}

///Get top n high scores
export async function getTopHighScores(n) {
    const [rows] = await pool.execute(`SELECT username, score FROM participants p LEFT JOIN users u ON u.user_id = p.user_id ORDER BY p.score DESC LIMIT ${Number(n)}`);
    return rows;
}

///Create game record
export async function createGameRecord(userId1, userId2) {
    try {
        const [result] = await pool.execute("INSERT INTO GAMES () VALUES ()")
        const gameId = result.insertId; 
        const participants = await pool.execute("INSERT INTO participants (game_id, user_id, score) VALUES (?, ?, ?), (?, ?, ?)", [gameId, userId1, 0, gameId, userId2, 0]);
        return gameId;
    } catch (err) {
        console.error("Unexpected DB error:", err);
        throw err;
    }
}

///Log action time
async function logActionTime(gameId, userId, currentScore) {
    const [result] = await pool.execute("UPDATE participants SET score = ?, last_action_time = NOW() WHERE game_id = ? AND user_id = ?", [currentScore, gameId, userId]);
    return result;
}

///Record game stats
export async function recordGameStats(gameId, winnerId, loserId, winnerScore, loserScore) {
    try {
        const [result1] = await pool.execute("UPDATE participants SET score = ?, last_action_time = NOW(), is_winner = 1 WHERE game_id = ? AND user_id = ?", [winnerScore, gameId, winnerId]);
        const [result2] = await pool.execute("UPDATE participants SET score = ?, last_action_time = NOW(), is_winner = 0 WHERE game_id = ? AND user_id = ?", [loserScore, gameId, loserId]);
        const [result3] = await pool.execute("UPDATE users SET win_count = win_count + 1, highest_score = GREATEST(highest_score, ?) WHERE user_id = ?", [winnerScore, winnerId]);
        return result1;   
    } catch (error) {
        console.error("Unexpected DB error:", error);
        throw error;
    }
}

// Save the events of the game for replay
export async function saveReplay(gameId, replayData) {
    try {
        const [result] = await pool.execute("INSERT INTO GAME_REPLAYS (game_id, replay_data) VALUES (?, ?)", [gameId, JSON.stringify(replayData)]);
        return result;
    } catch (err) {
        console.error("Unexprected DB error:", err);
        throw err;
    }
}

//Get game replay
export async function getReplay(gameId) {
    try {
        const [result] = await pool.execute("SELECT replay_data FROM GAME_REPLAYS WHERE game_id = ?", [gameId]);
        return result
    } catch (err) {
        console.error("Unexpected DB error:", err);
        throw err;
    }
}

export async function getUserGames(userId) {
    try {
        const [rows] = await pool.execute(`
            SELECT 
                g.game_id,
                g.play_date_time,
                p.score,
                p.is_winner,
                r.replay_data
            FROM PARTICIPANTS p
            JOIN GAMES g ON p.game_id = g.game_id
            LEFT JOIN GAME_REPLAYS r ON g.game_id = r.game_id
            WHERE p.user_id = ? 
            ORDER BY g.play_date_time DESC;`, [userId]
        );
        return rows;
    } catch (err) {
        console.error("Unexpected DB error", err);
        throw err;
    }
}

///TODO: update to add number of matches played column to users table and methods/table for powerups
