import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../../db';

interface TLoginUser {
    email: string;
    password: string;
}

const loginUserFromDB = async (payload: TLoginUser) => {
    const { email, password } = payload;

    // check user exists
    const query = `
        SELECT
            id,
            name,
            email,
            password,
            role,
            created_at,
            updated_at
        FROM users
        WHERE email = $1
    `;

    const result = await pool.query(query, [email]);

    const user = result.rows[0];

    if (!user) {
        throw new Error('Invalid email or password');
    }

    // compare password
    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
        throw new Error('Invalid email or password');
    }

    // create jwt token
    const token = jwt.sign(
        {
            id: user.id,
            name: user.name,
            role: user.role,
        },
        process.env.JWT_SECRET as string,
        {
            expiresIn: '7d',
        },
    );

    // remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
        token,
        user: userWithoutPassword,
    };
};

export const loginService = {
    loginUserFromDB,
};
