import { Router } from 'express';
import { createIssue } from './issues.controller';

const router = Router();

router.post('/', createIssue);

export const issuesRoute = router;
