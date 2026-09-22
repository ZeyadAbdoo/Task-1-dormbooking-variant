import { Router } from 'express';
import {
  getAllBookings,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking
} from '../controllers/bookingController.js';

const router = Router();

router.post('/', createBooking);
router.get('/', getAllBookings);
router.get('/:id', getBooking);
router.patch('/:id', updateBooking);
router.delete('/:id', deleteBooking);

export default router;
