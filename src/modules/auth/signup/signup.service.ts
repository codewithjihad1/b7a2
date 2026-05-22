import bcrypt from 'bcrypt';
import { pool } from '../../../db';

interface TSignupUser {
    name: string;
    email: string;
    password: string;
    role: 'contributor' | 'maintainer';
}

const signupUserIntoDB = async (payload: TSignupUser) => {
    const { name, email, password, role } = payload;

    // check existing user
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
        throw new Error('User already exists with this email');
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user
    const query = `
        INSERT INTO users (
            name,
            email,
            password,
            role
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            id,
            name,
            email,
            role,
            created_at,
            updated_at
    `;

    const values = [name, email, hashedPassword, role];

    const result = await pool.query(query, values);

    return result.rows[0];
};

export const signupService = {
    signupUserIntoDB,
};
