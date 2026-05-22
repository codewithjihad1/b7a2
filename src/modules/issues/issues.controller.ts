import type { Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { pool } from '../../db';

interface IssuePayload extends JwtPayload {
    id: number;
    name: string;
    role: string;
}

const createIssue = async (req: Request, res: Response) => {
    const { title, description, type } = req.body;

    if (!title || !description || !type) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const accessToken = req.headers.authorization;
        const verifyToken = jwt.verify(accessToken as string, process.env.JWT_SECRET as string) as IssuePayload;

        const isUserExists = await pool.query(`SELECT * FROM users WHERE id=$1`, [verifyToken.id]);
        if (isUserExists.rows.length === 0) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await pool.query(
            `
            INSERT INTO issues (title, description, type, reporter_id, status)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `,
            [title, description, type, verifyToken.id, 'open'],
        );

        res.status(201).json({ message: 'Issue created successfully', data: result.rows[0] });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or missing token', data: err });
    }
};

export { createIssue };
