import express from 'express';
import {
  create, update, getCarsByAdmin,
  getCarsBySeller,
  getCarsByBuyer,
} from '../controllers/car';

import { verifyToken, verifyAdmin } from '../middlewares/authentication';

const router = express.Router();
const routerNoAuth = express.Router();

router.use(verifyToken);


router.get('/cars', verifyAdmin, getCarsByAdmin);

router.get('/seller/cars', getCarsBySeller);

routerNoAuth.get('/buyer/cars', getCarsByBuyer);

router.post('/car', create);

router.put('/car/:id', update);

routerNoAuth.use(router);

export default routerNoAuth;
