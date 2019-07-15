import express from 'express';
import { passwordReset } from '../controllers/user';

const router = express.Router();


router.post('/users/:email/reset_password', passwordReset);

export default router;
