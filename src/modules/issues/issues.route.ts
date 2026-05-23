import { Router } from 'express';
import { createIssue, getAllIssues, getSingleIssue, updateIssue } from './issues.controller';

const router = Router();

router.post('/', createIssue);
router.get('/', getAllIssues);
router.get('/:id', getSingleIssue);
router.patch('/:id', updateIssue);

export const issuesRoute = router;
