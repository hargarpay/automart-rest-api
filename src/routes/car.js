import express from 'express';
import {
  create,
} from '../controllers/car';

import { verifyToken } from '../middlewares/authentication';

const router = express.Router();

router.use(verifyToken);

router.post('/car', create);

export default router;
