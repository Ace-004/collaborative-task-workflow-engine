import { pool } from "../pool.js";
export const createUserQuery = async (email, password_hash) => {
    try {
        const result = await pool.query("INSERT INTO users (email,password_hash) values ($1,$2) RETURNING id,email", [email, password_hash]);
        return result.rows[0];
    }
    catch (error) {
        console.error("Error in createUserQuery:", error);
        throw error;
    }
};
export const getUserQuery = async (email) => {
    try {
        const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
        return result.rows[0];
    }
    catch (error) {
        console.error("Error in getUserQuery:", error);
        throw error;
    }
};
//# sourceMappingURL=user.query.js.map