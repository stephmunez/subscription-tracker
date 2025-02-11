import { Router } from 'express';
import {
  createSubscription,
  getAllSubscriptions,
  getSubscription,
  getUserSubscriptions,
} from '../controllers/subscription.controller.js';
import authorize from '../middlewares/auth.middleware.js';

const subscriptionRouter = new Router();

subscriptionRouter.get('/', getAllSubscriptions);

subscriptionRouter.get('/:id', authorize, getSubscription);

subscriptionRouter.post('/', authorize, createSubscription);

subscriptionRouter.put('/:id', (req, res) =>
  res.send({ title: 'UPDATE subscription' })
);

subscriptionRouter.delete('/:id', (req, res) =>
  res.send({ title: 'DELETE subscription' })
);

subscriptionRouter.get('/user/:id', authorize, getUserSubscriptions);

subscriptionRouter.put('/:id/cancel', (req, res) =>
  res.send({ title: 'CANCEL subscription' })
);

subscriptionRouter.put('/upcoming-renewals', (req, res) =>
  res.send({ title: 'GET upcoming renewals' })
);

export default subscriptionRouter;
