import { Router } from 'express';
import { createIssue, getAllIssues } from './issues.controller';

const router = Router();

router.post('/', createIssue);
router.get('/', getAllIssues);

export const issuesRoute = router;
