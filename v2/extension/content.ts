import { Router } from './router';

const router = new Router();

const page = router.getScraper().readPage();

// Development logging - remove in production
if (process.env['NODE_ENV'] === 'development') {
  console.log("here's your page", page);
}
