import mysql2 from "mysql2";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

///load env variables
dotenv.config();

///Setup db connection pool
const pool = mysql2.createPool({
    host: process.env.mySQL_Host,
    user: process.env.mySQL_User,
    password: process.env.mySQL_Password,
    database: process.env.mySQL_Database
}).promise();

const SALT_ROUNDS = 12;  // Good balance of security & speed

// Private helper: is not included in exports
//Pre: password is string
//Post: returns hashed password
async function _hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

// Private helper: is not included in exports
//Pre: password is string, hash is hashed password string
//Post: returns true if password matches hash, else false
async function _verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// Pre: username and password are strings
// Post: creates new user in USERS table, returns the user_id of new user or null if username exists
export async function createUser(username, password) {
    try {
        const [existing] = await pool.execute("SELECT user_id FROM USERS WHERE username = ?",[username]);
        if (existing.length > 0) {
            console.warn(`Username "${username}" already exists.`);
            return null;
        } else {
            // Only hash the password if it's non-empty (for guest users)
            const hashed = password ? await _hashPassword(password) : "";
            const [result] = await pool.execute("INSERT INTO USERS (username, password, highest_score, win_count) VALUES (?, ?, ?, ?)",[username, hashed, 0, 0]);
            return result.insertId;
        }
    } catch (err) {
        console.error("Unexpected DB error:", err);
        throw err;
    }
}

// Pre: username and password are strings
// Post: returns user_id if username/password match, else null
export async function isValidUser(username, password) {
    //guest login doesn't need a password
    if (username === "guest") {
        const [rows] = await pool.execute("SELECT user_id FROM USERS WHERE username = ?", [username]);
        return rows.length > 0 ? rows[0].user_id : null;
    }

    // Normal user login with password verification
    const [rows] = await pool.execute("SELECT user_id, password FROM USERS WHERE username = ?",[username]);
    if (rows.length === 0) return null;

    const { user_id, password: storedHash } = rows[0];
    const match = await _verifyPassword(password, storedHash);
    return match ? user_id : null;
}

//Pre: username is string
//Post: returns the highest score of the user with given username, or null if user not found
export async function getUserHighScore(username) {
    const [rows] = await pool.execute(`SELECT MAX(p.score) AS personal_best FROM PARTICIPANTS p JOIN USERS u ON u.user_id = p.user_id WHERE u.username = ?`, [username]);
    if (rows.length > 0) {
        return rows[0].personal_best;
    } else {
        return null;
    }
}

//Pre: n is number of top scores to retrieve
//Post: returns array of top n high scores with usernames
export async function getTopHighScores(n) {
    const [rows] = await pool.execute(`SELECT username, score FROM PARTICIPANTS p LEFT JOIN USERS u ON u.user_id = p.user_id ORDER BY p.score DESC LIMIT ${Number(n)}`);
    return rows;
}

//Pre: userId1 and userId2 are the user IDs of the two players
//Post: creates a new game record in GAMES and PARTICIPANTS tables, returns the new game_id
export async function createGameRecord(userId1, userId2) {
    try {
        const [result] = await pool.execute("INSERT INTO GAMES (play_date_time) VALUES (NOW())")
        const gameId = result.insertId; 
        const participants = await pool.execute("INSERT INTO PARTICIPANTS (game_id, user_id, score) VALUES (?, ?, ?), (?, ?, ?)", [gameId, userId1, 0, gameId, userId2, 0]);
        return gameId;
    } catch (err) {
        console.error("Unexpected DB error:", err);
        console.log("Failed to create game record for users:", userId1, userId2);
        throw err;
    }
}

//Pre: gameId, userId are IDs, currentScore is number
//Post: updates PARTICIPANTS record with current score and last action time
export
async function logActionTime(gameId, userId, currentScore) {
    const [result] = await pool.execute("UPDATE PARTICIPANTS SET score = ?, last_action_time = NOW() WHERE game_id = ? AND user_id = ?", [currentScore, gameId, userId]);
    return result;
}

//Pre: gameId, winnerId, loserId are IDs, winnerScore and loserScore are numbers
//Post: updates PARTICIPANTS and USERS tables with final scores and win/loss info for the given game
export async function recordGameStats(gameId, winnerId, loserId, winnerScore, loserScore) {
    try {
        const [result1] = await pool.execute("UPDATE PARTICIPANTS SET score = ?, last_action_time = NOW(), is_winner = 1 WHERE game_id = ? AND user_id = ?", [winnerScore, gameId, winnerId]);
        const [result2] = await pool.execute("UPDATE PARTICIPANTS SET score = ?, last_action_time = NOW(), is_winner = 0 WHERE game_id = ? AND user_id = ?", [loserScore, gameId, loserId]);
        const [result3] = await pool.execute("UPDATE USERS SET win_count = win_count + 1, highest_score = GREATEST(highest_score, ?) WHERE user_id = ?", [winnerScore, winnerId]);
        const [result4] = await pool.execute("UPDATE USERS SET highest_score = GREATEST(highest_score, ?) WHERE user_id = ?", [loserScore, loserId]);
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

//Get game replay events
export async function getReplay(gameId) {
    try {
        const [result] = await pool.execute("SELECT replay_data FROM GAME_REPLAYS WHERE game_id = ?", [gameId]);
        return result
    } catch (err) {
        console.error("Unexpected DB error:", err);
        throw err;
    }
}

//Pre: userId is ID of user in USERS table
//Post: returns array of game records for the user
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