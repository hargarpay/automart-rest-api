import express from 'express';
import {
  create,
} from '../controllers/flag';

import { verifyToken } from '../middlewares/authentication';

const router = express.Router();

router.use(verifyToken);

router.post('/flag', create);

export default router;
