import express from 'express';
import { localPrefix, verifyToken } from '../middlewares/authentication';
import { media, getImages } from '../controllers/media';


const router = express.Router();

router.use(verifyToken, localPrefix);

router.get('/media', getImages);

router.post('/media', media);


export default router;
