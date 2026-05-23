import { Router } from 'express';
import { createIssue, deleteIssue, getAllIssues, getSingleIssue, updateIssue } from './issues.controller';

const router = Router();

router.post('/', createIssue);
router.get('/', getAllIssues);
router.get('/:id', getSingleIssue);
router.patch('/:id', updateIssue);
router.delete('/:id', deleteIssue);

export const issuesRoute = router;
