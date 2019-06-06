import express from 'express';
import Auth from './auth';

const router = express.Router();
const version = '/v1';

router.use(version, Auth);

export default router;
