import express from 'express';
import {
  create, update, getCars,
} from '../controllers/car';

import { verifyToken } from '../middlewares/authentication';

const router = express.Router();

router.use(verifyToken);

router.get('/cars', getCars);

router.post('/car', create);

router.put('/car/:id', update);

export default router;
