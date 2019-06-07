import express from 'express';
import {
  create, update,
} from '../controllers/car';

import { verifyToken } from '../middlewares/authentication';

const router = express.Router();

router.use(verifyToken);

router.post('/car', create);

router.put('/car/:id', update);

export default router;
