import express from 'express';
import { create, updatePrice } from '../controllers/order';
import { verifyToken } from '../middlewares/authentication';

const router = express.Router();

router.use(verifyToken);

router.post('/order', create);

router.patch('/order/:id/price', updatePrice);

export default router;
