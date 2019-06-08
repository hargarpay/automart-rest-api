import express from 'express';
import { create } from '../controllers/order';
import { verifyToken } from '../middlewares/authentication';

const router = express.Router();

router.use(verifyToken);

router.post('/order', create);

export default router;
