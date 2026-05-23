import { pool } from '../../db';

type SortOrder = 'newest' | 'oldest';
type IssueType = 'bug' | 'feature_request';
type IssueStatus = 'open' | 'in_progress' | 'resolved';

type GetAllIssuesParams = {
    sort: SortOrder;
    type?: IssueType;
    status?: IssueStatus;
};

type UpdateIssueParams = {
    id: number;
    userId: number;
    role: string;
    title?: string;
    description?: string;
    type?: IssueType;
};

type IssueResponse = {
    id: number;
    title: string;
    description: string;
    type: IssueType;
    status: IssueStatus;
    reporter: {
        id: number;
        name: string;
        role: string;
    } | null;
    created_at: Date;
    updated_at: Date;
};

type IssueRow = {
    id: number;
    title: string;
    description: string;
    type: IssueType;
    status: IssueStatus;
    reporter_id: number | string;
    created_at: Date;
    updated_at: Date;
};

type UserRow = {
    id: number | string;
    role: string;
};

type ReporterRow = {
    id: number | string;
    name: string;
    role: string;
};

const getAllIssuesFromDB = async (params: GetAllIssuesParams) => {
    const whereClauses: string[] = [];
    const values: Array<string> = [];

    if (params.type) {
        whereClauses.push(`type = $${values.length + 1}`);
        values.push(params.type);
    }

    if (params.status) {
        whereClauses.push(`status = $${values.length + 1}`);
        values.push(params.status);
    }

    const whereQuery = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const sortDirection = params.sort === 'oldest' ? 'ASC' : 'DESC';

    const issuesResult = await pool.query<IssueRow>(
        `
		SELECT * FROM issues
		${whereQuery}
		ORDER BY created_at ${sortDirection}
		`,
        values,
    );

    if (issuesResult.rows.length === 0) {
        return [];
    }

    const reporterIds = [...new Set(issuesResult.rows.map((issue) => issue.reporter_id))];
    const reportersResult = await pool.query<ReporterRow>(
        `
		SELECT id, name, role
		FROM users
		WHERE id = ANY($1::bigint[])
		`,
        [reporterIds],
    );

    const reporterMap = new Map<string, ReporterRow>();
    for (const reporter of reportersResult.rows) {
        reporterMap.set(String(reporter.id), reporter);
    }

    return issuesResult.rows.map((issue): IssueResponse => {
        const reporter = reporterMap.get(String(issue.reporter_id));

        return {
            id: issue.id,
            title: issue.title,
            description: issue.description,
            type: issue.type,
            status: issue.status,
            reporter: reporter
                ? {
                      id: Number(reporter.id),
                      name: reporter.name,
                      role: reporter.role,
                  }
                : null,
            created_at: issue.created_at,
            updated_at: issue.updated_at,
        };
    });
};

const getIssueByIdFromDB = async (id: number) => {
    const issueResult = await pool.query<IssueRow>(
        `
        SELECT * FROM issues
        WHERE id = $1
        `,
        [id],
    );

    if (issueResult.rows.length === 0) {
        return null;
    }

    const issue = issueResult.rows[0]!;
    const reporterResult = await pool.query<ReporterRow>(
        `
        SELECT id, name, role
        FROM users
        WHERE id = $1
        `,
        [issue.reporter_id],
    );

    const reporter = reporterResult.rows[0];

    return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: reporter
            ? {
                  id: Number(reporter.id),
                  name: reporter.name,
                  role: reporter.role,
              }
            : null,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
    } satisfies IssueResponse;
};

const updateIssueInDB = async (params: UpdateIssueParams) => {
    const issueResult = await pool.query<IssueRow>(
        `
        SELECT * FROM issues
        WHERE id = $1
        `,
        [params.id],
    );

    if (issueResult.rows.length === 0) {
        return null;
    }

    const issue = issueResult.rows[0]!;

    if (params.role !== 'maintainer') {
        if (String(issue.reporter_id) !== String(params.userId)) {
            throw new Error('Forbidden');
        }

        if (issue.status !== 'open') {
            throw new Error('Issue cannot be updated once it is not open');
        }
    }

    const userResult = await pool.query<UserRow>(
        `
        SELECT id, role
        FROM users
        WHERE id = $1
        `,
        [params.userId],
    );

    if (userResult.rows.length === 0) {
        throw new Error('Unauthorized');
    }

    const updateFields: string[] = [];
    const values: Array<string> = [];

    if (params.title !== undefined) {
        updateFields.push(`title = $${values.length + 1}`);
        values.push(params.title);
    }

    if (params.description !== undefined) {
        updateFields.push(`description = $${values.length + 1}`);
        values.push(params.description);
    }

    if (params.type !== undefined) {
        updateFields.push(`type = $${values.length + 1}`);
        values.push(params.type);
    }

    if (updateFields.length === 0) {
        throw new Error('At least one field is required to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateValues = [...values, params.id];

    const updatedIssue = await pool.query<IssueRow>(
        `
        UPDATE issues
        SET ${updateFields.join(', ')}
        WHERE id = $${updateValues.length}
        RETURNING *
        `,
        updateValues,
    );

    return updatedIssue.rows[0] ?? null;
};

export const issuesService = {
    getAllIssuesFromDB,
    getIssueByIdFromDB,
    updateIssueInDB,
};
