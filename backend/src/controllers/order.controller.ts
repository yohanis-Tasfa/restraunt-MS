import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const orderService = new OrderService();

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const {
    page,
    limit,
    search,
    branchId,
    status,
    type,
    customerId,
    startDate,
    endDate,
  } = req.query;

  const result = await orderService.getAll({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    branchId: branchId as string,
    status: status as string,
    type: type as string,
    customerId: customerId as string,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  res.status(200).json(
    new ApiResponse(200, result, 'Orders fetched successfully')
  );
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await orderService.getById(id);

  res.status(200).json(
    new ApiResponse(200, order, 'Order fetched successfully')
  );
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { type, branchId, tableId, customerId, items, notes, specialInstructions, discount } =
    req.body;

  if (!type || !branchId || !items || items.length === 0) {
    throw new ApiError(400, 'Type, branchId, and items are required');
  }

  const order = await orderService.create(
    {
      type,
      branchId,
      tableId,
      customerId,
      items,
      notes,
      specialInstructions,
      discount: discount ? parseFloat(discount) : undefined,
    },
    req.user.id
  );

  res.status(201).json(
    new ApiResponse(201, order, 'Order created successfully')
  );
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };

  if (data.discount) data.discount = parseFloat(data.discount);

  const order = await orderService.update(id, data);

  res.status(200).json(
    new ApiResponse(200, order, 'Order updated successfully')
  );
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new ApiError(400, 'Status is required');
  }

  const order = await orderService.updateStatus(id, status);

  res.status(200).json(
    new ApiResponse(200, order, `Order status updated to ${status}`)
  );
});

export const addItems = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items } = req.body;

  if (!items || items.length === 0) {
    throw new ApiError(400, 'Items array is required');
  }

  const order = await orderService.addItems(id, items);

  res.status(200).json(
    new ApiResponse(200, order, 'Items added to order successfully')
  );
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const { id, itemId } = req.params;

  const order = await orderService.removeItem(id, itemId);

  res.status(200).json(
    new ApiResponse(200, order, 'Item removed from order successfully')
  );
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await orderService.cancel(id, reason);

  res.status(200).json(
    new ApiResponse(200, order, 'Order cancelled successfully')
  );
});

export const getDailyStats = asyncHandler(async (req: Request, res: Response) => {
  const { branchId, date } = req.query;

  const stats = await orderService.getDailyStats(branchId as string, date as string);

  res.status(200).json(
    new ApiResponse(200, stats, 'Daily statistics fetched successfully')
  );
});

export const getReceipt = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await orderService.getById(id);

  // Format receipt data
  const receipt = {
    restaurant: {
      name: order.branch.restaurant.name,
      logo: order.branch.restaurant.logo,
      phone: order.branch.restaurant.phone,
      address: order.branch.restaurant.address,
    },
    branch: {
      name: order.branch.name,
    },
    order: {
      number: order.orderNumber,
      type: order.type,
      date: order.createdAt,
      table: order.table?.number,
    },
    customer: order.customer
      ? {
          name: `${order.customer.firstName} ${order.customer.lastName}`,
          phone: order.customer.phone,
        }
      : null,
    items: order.items.map((item) => ({
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    })),
    totals: {
      subtotal: order.subtotal,
      tax: order.tax,
      vat: order.vat,
      serviceCharge: order.serviceCharge,
      discount: order.discount,
      total: order.total,
    },
    payments: order.payments.map((payment) => ({
      method: payment.method,
      amount: payment.amount,
      reference: payment.reference,
      date: payment.createdAt,
    })),
    cashier: {
      name: `${order.createdBy.firstName} ${order.createdBy.lastName}`,
    },
  };

  res.status(200).json(
    new ApiResponse(200, receipt, 'Receipt generated successfully')
  );
});
