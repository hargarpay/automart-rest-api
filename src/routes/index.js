import express from 'express';
import Auth from './auth';
import Car from './car';
import Order from './order';
import Media from './media';
import Flag from './flag';

const router = express.Router();
const version = '/v1';

router.use(version, Auth);
router.use(version, Car);
router.use(version, Order);
router.use(version, Media);
router.use(version, Flag);

export default router;
