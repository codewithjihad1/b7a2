import type { Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import { pool } from '../../db';
import { issuesService } from './issues.service';

interface IssuePayload extends JwtPayload {
    id: number;
    name: string;
    role: string;
}

type SortOrder = 'newest' | 'oldest';
type IssueType = 'bug' | 'feature_request';
type IssueStatus = 'open' | 'in_progress' | 'resolved';

const getSingleQueryValue = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
        return value;
    }

    return undefined;
};

const isValidIssueType = (value: unknown): value is IssueType => {
    return value === 'bug' || value === 'feature_request';
};

const getAllIssues = async (req: Request, res: Response) => {
    const sort = getSingleQueryValue(req.query.sort) ?? 'newest';
    const type = getSingleQueryValue(req.query.type);
    const status = getSingleQueryValue(req.query.status);

    const validSort: SortOrder[] = ['newest', 'oldest'];
    const validTypes: IssueType[] = ['bug', 'feature_request'];
    const validStatus: IssueStatus[] = ['open', 'in_progress', 'resolved'];

    if (!validSort.includes(sort as SortOrder)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid sort value. Allowed: newest, oldest',
        });
    }

    if (type && !validTypes.includes(type as IssueType)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid type value. Allowed: bug, feature_request',
        });
    }

    if (status && !validStatus.includes(status as IssueStatus)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value. Allowed: open, in_progress, resolved',
        });
    }

    try {
        const queryOptions: {
            sort: SortOrder;
            type?: IssueType;
            status?: IssueStatus;
        } = {
            sort: sort as SortOrder,
        };

        if (type) {
            queryOptions.type = type as IssueType;
        }

        if (status) {
            queryOptions.status = status as IssueStatus;
        }

        const issues = await issuesService.getAllIssuesFromDB(queryOptions);

        return res.status(200).json({
            success: true,
            message: 'Get all issues Successfully!',
            data: issues,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch issues',
            data: error,
        });
    }
};

const getSingleIssue = async (req: Request, res: Response) => {
    const issueId = Number(req.params.id);

    if (!Number.isInteger(issueId) || issueId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid issue id',
        });
    }

    try {
        const issue = await issuesService.getIssueByIdFromDB(issueId);

        if (!issue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: "Successfully fetch issue",
            data: issue,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch issue',
            data: error,
        });
    }
};

const updateIssue = async (req: Request, res: Response) => {
    const issueId = Number(req.params.id);
    const { title, description, type } = req.body;

    if (!Number.isInteger(issueId) || issueId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid issue id',
        });
    }

    if (title === undefined && description === undefined && type === undefined) {
        return res.status(400).json({
            success: false,
            message: 'At least one field is required to update',
        });
    }

    if (type !== undefined && !isValidIssueType(type)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid type value. Allowed: bug, feature_request',
        });
    }

    const accessToken = req.headers.authorization;

    if (!accessToken) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }

    try {
        const decoded = jwt.verify(accessToken, config.secret as string) as IssuePayload;

        const updatedIssue = await issuesService.updateIssueInDB({
            id: issueId,
            userId: Number(decoded.id),
            role: decoded.role,
            title,
            description,
            type,
        });

        if (!updatedIssue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Issue updated successfully',
            data: updatedIssue,
        });
    } catch (error: any) {
        if (error.message === 'Forbidden') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden',
            });
        }

        if (error.message === 'Issue cannot be updated once it is not open') {
            return res.status(403).json({
                success: false,
                message: 'Contributors can only update their own open issues',
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }
};

const deleteIssue = async (req: Request, res: Response) => {
    const issueId = Number(req.params.id);
    const accessToken = req.headers.authorization;

    if (!Number.isInteger(issueId) || issueId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid issue id',
        });
    }

    if (!accessToken) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }

    try {
        const decoded = jwt.verify(accessToken, config.secret as string) as IssuePayload;

        if (decoded.role !== 'maintainer') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden',
            });
        }

        const deletedIssue = await issuesService.deleteIssueFromDB(issueId);

        if (!deletedIssue) {
            return res.status(404).json({
                success: false,
                message: 'Issue not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Issue deleted successfully',
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
        });
    }
};

const createIssue = async (req: Request, res: Response) => {
    const { title, description, type } = req.body;

    if (!title || !description || !type) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const accessToken = req.headers.authorization;
        const verifyToken = jwt.verify(accessToken as string, config.secret as string) as IssuePayload;

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

        res.status(201).json({ success: true, message: 'Issue created successfully', data: result.rows[0] });
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Issue creation failed', data: err });
    }
};

export { createIssue, deleteIssue, getAllIssues, getSingleIssue, updateIssue };
