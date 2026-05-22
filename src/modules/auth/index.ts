import { Router } from 'express';
import { loginController } from './login/login.controller';
import { signupController } from './signup/signup.controller';

const router = Router();

router.post('/signup', signupController.signupUser);
router.post('/login', loginController.loginUser);

export const authRoute = router;
