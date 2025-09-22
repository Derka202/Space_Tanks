import mysql2 from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql2.createPool({
    host: process.env.mySQL_Host,
    user: process.env.mySQL_User,
    password: process.env.mySQL_Password,
    database: process.env.mySQL_Database
}).promise();

const result = await pool.query("SELECT * FROM users");
const rows = result[0];
console.log(rows);

///Create user
async function createUser(username, password) {
    try {
        const [result] = await pool.execute("INSERT INTO users (username, password, highest_score, win_count) VALUES (?, ?, ?, ?)", [username, password, 0, 0]);
        return result.insertId;
    }   catch (err) {
        ///Handle duplicate entry error gracefully
        if (err.code === 'ER_DUP_ENTRY') {
            console.warn(`Username "${username}" already exists.`);
            return null; 
        } else {
            console.error("Unexpected DB error:", err);
            throw err;
        }
    }
}

///Verify user login
async function isValidUser(username, password) {
    const [result] = await pool.execute("SELECT user_id FROM users WHERE username = ? AND password = ?", [username, password]);
    return rows.length > 0 ? result[0].user_id : null;
}

///Get user highscore
async function getUserHighScore(username) {
    const [rows] = await pool.execute("SELECT highest_score FROM users WHERE username = ?", [username]);
    if (rows.length > 0) {
        return rows[0].highest_score;
    } else {
        return null;
    }
}

///Get top n high scores
///Create game record
///Log action time
///Record game stats