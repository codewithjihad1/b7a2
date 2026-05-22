import type { Request, Response } from 'express';
import { signupService } from './signup.service';

const signupUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        if (!['contributor', 'maintainer'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role',
            });
        }

        const result = await signupService.signupUserIntoDB(req.body);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: result,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};

export const signupController = {
    signupUser,
};
