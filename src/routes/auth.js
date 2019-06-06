import express from 'express';
import { register } from '../controllers/auth';

const router = express.Router();

router.post('/auth/signup', register);


export default router;
