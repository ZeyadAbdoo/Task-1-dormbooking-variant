import Joi from 'joi';
import { Booking } from '../models/Booking.js';

// Joi validates shape/types. startDate < endDate can't be expressed by
// Joi's type system alone, so it's checked explicitly in each handler.
const bookingSchema = Joi.object({
  roomNumber: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  purpose: Joi.string().allow('', null),
  bookedBy: Joi.string().hex().length(24).allow(null),
});

// Two ranges [aStart, aEnd) and [bStart, bEnd) overlap when
// aStart < bEnd AND bStart < aEnd. excludeId lets update checks skip
// comparing a booking against itself.
async function findConflict(roomNumber, startDate, endDate, excludeId = null) {
  const query = {
    roomNumber,
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Booking.findOne(query);
}

// GET /api/bookings
export async function getAllBookings(req, res, next) {
  try {
    const bookings = await Booking.find().populate('bookedBy', 'name email');
    res.status(200).json(bookings);
  } catch (err) { next(err); }
}

// GET /api/bookings/:id
export async function getBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate('bookedBy', 'name email');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json(booking);
  } catch (err) { next(err); }
}

// POST /api/bookings
export async function createBooking(req, res, next) {
  try {
    const { error, value } = bookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { roomNumber, startDate, endDate } = value;

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'startDate must be before endDate' });
    }

    const conflict = await findConflict(roomNumber, startDate, endDate);
    if (conflict) {
      return res.status(409).json({ message: 'This room is already booked for that time range' });
    }

    const booking = await Booking.create(value);
    res.status(201).json(booking);
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id
export async function updateBooking(req, res, next) {
  try {
    const { error, value } = bookingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { roomNumber, startDate, endDate } = value;

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'startDate must be before endDate' });
    }

    const conflict = await findConflict(roomNumber, startDate, endDate, req.params.id);
    if (conflict) {
      return res.status(409).json({ message: 'This room is already booked for that time range' });
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    }).populate('bookedBy', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json(booking);
  } catch (err) { next(err); }
}

// DELETE /api/bookings/:id
export async function deleteBooking(req, res, next) {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json({ message: 'Booking deleted' });
  } catch (err) { next(err); }
}