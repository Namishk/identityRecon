import { Router } from 'express';
import { identifyUser } from '../controllers/identify.controller';

const router = Router();

router.post('/', identifyUser);

export default router;
