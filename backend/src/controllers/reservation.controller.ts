import { Request, Response } from 'express';
import { ReservationService } from '../services/reservation.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const reservationService = new ReservationService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, branchId, customerId, status, startDate, endDate } = req.query;

  const result = await reservationService.getAll({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    branchId: branchId as string,
    customerId: customerId as string,
    status: status as string,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Reservations fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const reservation = await reservationService.getById(id);

  res.status(200).json(
    new ApiResponse(200, reservation, 'Reservation fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, branchId, tableId, reservationDate, guests, notes } = req.body;

  if (!customerId || !branchId || !reservationDate || !guests) {
    throw new ApiError(400, 'CustomerId, branchId, reservationDate, and guests are required');
  }

  const reservation = await reservationService.create({
    customerId,
    branchId,
    tableId,
    reservationDate: new Date(reservationDate),
    guests: parseInt(guests),
    notes,
  });

  res.status(201).json(
    new ApiResponse(201, reservation, 'Reservation created successfully')
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };

  if (data.reservationDate) data.reservationDate = new Date(data.reservationDate);
  if (data.guests) data.guests = parseInt(data.guests);

  const reservation = await reservationService.update(id, data);

  res.status(200).json(
    new ApiResponse(200, reservation, 'Reservation updated successfully')
  );
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, 'Status is required');
  }

  const reservation = await reservationService.updateStatus(id, status);

  res.status(200).json(
    new ApiResponse(200, reservation, `Reservation status updated to ${status}`)
  );
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const reservation = await reservationService.cancel(id, reason);

  res.status(200).json(
    new ApiResponse(200, reservation, 'Reservation cancelled successfully')
  );
});

export const getUpcoming = asyncHandler(async (req: Request, res: Response) => {
  const { branchId, days } = req.query;

  if (!branchId) {
    throw new ApiError(400, 'Branch ID is required');
  }

  const reservations = await reservationService.getUpcoming(
    branchId as string,
    days ? parseInt(days as string) : undefined
  );

  res.status(200).json(
    new ApiResponse(200, reservations, 'Upcoming reservations fetched successfully')
  );
});
