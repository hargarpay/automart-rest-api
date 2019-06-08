import express from 'express';
import {
  create, update, getCarsByAdmin,
  getCarsBySeller,
  getCarsByBuyer,
  remove,
  getCar,
  updatePrice,
  updateStatus,
  publish,
  draft,
} from '../controllers/car';

import {
  verifyToken,
  verifyAdmin,
  verifyPublished,
  verifySeller,
} from '../middlewares/authentication';

const routerAuth = express.Router();
const routerNoAuth = express.Router();

routerAuth.use(verifyToken);


routerAuth.get('/cars', verifyAdmin, getCarsByAdmin);

routerNoAuth.get('/car/:id', verifyPublished, getCar);

routerAuth.get('/car/:id', verifySeller, getCar);

routerAuth.get('/car/:id', verifyAdmin, getCar);

routerAuth.get('/seller/cars', getCarsBySeller);

routerNoAuth.get('/buyer/cars', getCarsByBuyer);

routerAuth.post('/car', create);

routerAuth.put('/car/:id', update);

routerAuth.patch('/car/:id/price', updatePrice);

routerAuth.patch('/car/:id/publish', publish);

routerAuth.patch('/car/:id/draft', draft);

routerAuth.patch('/car/:id/status', updateStatus);

routerAuth.delete('/car/:id', remove);


routerNoAuth.use(routerAuth);

export default routerNoAuth;
