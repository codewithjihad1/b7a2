import { pool } from '../../db';

type SortOrder = 'newest' | 'oldest';
type IssueType = 'bug' | 'feature_request';
type IssueStatus = 'open' | 'in_progress' | 'resolved';

type GetAllIssuesParams = {
    sort: SortOrder;
    type?: IssueType;
    status?: IssueStatus;
};

type IssueRow = {
    id: number;
    title: string;
    description: string;
    type: IssueType;
    status: IssueStatus;
    reporter_id: number;
    created_at: Date;
    updated_at: Date;
};

type ReporterRow = {
    id: number;
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
		SELECT id, title, description, type, status, reporter_id, created_at, updated_at
		FROM issues
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

    const reporterMap = new Map<number, ReporterRow>();
    for (const reporter of reportersResult.rows) {
        reporterMap.set(reporter.id, reporter);
    }

    return issuesResult.rows.map((issue) => {
        const reporter = reporterMap.get(issue.reporter_id);

        return {
            id: issue.id,
            title: issue.title,
            description: issue.description,
            type: issue.type,
            status: issue.status,
            reporter: reporter
                ? {
                      id: reporter.id,
                      name: reporter.name,
                      role: reporter.role,
                  }
                : null,
            created_at: issue.created_at,
            updated_at: issue.updated_at,
        };
    });
};

export const issuesService = {
    getAllIssuesFromDB,
};
