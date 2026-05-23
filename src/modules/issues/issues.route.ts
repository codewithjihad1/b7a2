import { Router } from 'express';
import { createIssue, getAllIssues, getSingleIssue } from './issues.controller';

const router = Router();

router.post('/', createIssue);
router.get('/', getAllIssues);
router.get('/:id', getSingleIssue);

export const issuesRoute = router;
