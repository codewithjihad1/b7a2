import { Router } from 'express';
import { createIssue, deleteIssue, getAllIssues, getSingleIssue, updateIssue } from './issues.controller';
import auth from '../../middleware/auth';

const router = Router();

router.post('/', auth(), createIssue);
router.get('/', getAllIssues);
router.get('/:id', getSingleIssue);
router.patch('/:id', auth(), updateIssue);
router.delete('/:id', auth(), deleteIssue);

export const issuesRoute = router;
