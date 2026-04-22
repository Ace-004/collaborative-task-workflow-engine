import { pool } from '../db/pool.js';
import bcrypt from 'bcryptjs';
import { createUserQuery, getUserQuery } from '../db/queries/user.query.js';
import { generateToken } from '../utils/generatetoken.js';
export const registerUserController = async (req, res) => {
    const { email, password } = req.body;
    try {
        const exist_user = await getUserQuery(email);
        if (exist_user)
            return res.status(400).json({ success: false, message: "email already registered" });
        const password_hash = await bcrypt.hash(password, 12);
        const user = await createUserQuery(email, password_hash);
        const token = generateToken(user);
        res.status(201).json({ success: true, data: user, token });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "server error" });
    }
};
export const loginUserController = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await getUserQuery(email);
        console.log(user);
        if (!user)
            return res.status(404).json({ success: false, message: "user not found" });
        const password_hash = await bcrypt.compare(password, user.password_hash);
        if (!password_hash)
            return res.status(400).json({ success: false, message: "invalid credentials" });
        const data = {
            id: user.id,
            email
        };
        const token = generateToken(data);
        res.status(200).json({ success: true, data, token });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "error" });
    }
};
//# sourceMappingURL=auth.controller.js.map