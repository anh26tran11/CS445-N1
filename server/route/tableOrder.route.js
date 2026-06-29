import { Router } from 'express';
import auth from '../middleware/auth.js';
import {
    addItemsToTableOrder,
    getCurrentTableOrder,
    checkoutTableOrder,
    cancelTableOrder,
    getAllActiveTableOrders
} from '../controllers/tableOrder.controller.js';

const tableOrderRouter = Router();

tableOrderRouter.post('/add-items', auth, addItemsToTableOrder);
tableOrderRouter.get('/current', auth, getCurrentTableOrder);
tableOrderRouter.post('/checkout', auth, checkoutTableOrder);
tableOrderRouter.post('/cancel', auth, cancelTableOrder);
tableOrderRouter.get('/all-active', auth, getAllActiveTableOrders);

export default tableOrderRouter;
