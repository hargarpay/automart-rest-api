import express from 'express';
import { register, login } from '../controllers/auth';

const router = express.Router();

router.post('/auth/signup', register);

router.post('/auth/signin', login);

export default router;
