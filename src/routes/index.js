import express from 'express';
import Auth from './auth';
import Car from './car';
import Order from './order';

const router = express.Router();
const version = '/v1';

router.use(version, Auth);
router.use(version, Car);
router.use(version, Order);

export default router;
