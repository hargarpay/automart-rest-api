import express from 'express';
import {
  create, update, getCarsByAdmin,
  getCarsBySeller,
//   getCarsByBuyer,
} from '../controllers/car';

import { verifyToken, verifyAdmin } from '../middlewares/authentication';

const router = express.Router();

router.use(verifyToken);

router.get('/cars', verifyAdmin, getCarsByAdmin);

router.get('/seller/cars', getCarsBySeller);

router.post('/car', create);

router.put('/car/:id', update);

export default router;
