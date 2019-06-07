import express from 'express';
import {
  create, update, getCarsByAdmin,
  getCarsBySeller,
  getCarsByBuyer,
  remove,
  getCar,
} from '../controllers/car';

import {
  verifyToken,
  verifyAdmin,
  verifyPublished,
  verifySeller,
} from '../middlewares/authentication';

const router = express.Router();
const routerNoAuth = express.Router();

router.use(verifyToken);


router.get('/cars', verifyAdmin, getCarsByAdmin);

routerNoAuth.get('/car/:id', verifyPublished, getCar);

router.get('/car/:id', verifySeller, getCar);

router.get('/car/:id', verifyAdmin, getCar);

router.get('/seller/cars', getCarsBySeller);

routerNoAuth.get('/buyer/cars', getCarsByBuyer);

router.post('/car', create);

router.put('/car/:id', update);

router.delete('/car/:id', remove);


routerNoAuth.use(router);

export default routerNoAuth;
