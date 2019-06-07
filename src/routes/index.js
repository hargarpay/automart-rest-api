import express from 'express';
import Auth from './auth';
import Car from './car';

const router = express.Router();
const version = '/v1';

router.use(version, Auth);
router.use(version, Car);

export default router;
