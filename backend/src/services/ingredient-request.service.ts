import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';
import { websocketService } from './websocket.service';

export interface IngredientRequestItem {
  id: string;
  requestNumber: string;
  branchId: string;
  requestedById: string;
  requestedByName: string;
  inventoryId: string;
  inventoryName: string;
  quantity: number;
  unit: string;
  priority: 'NORMAL' | 'URGENT';
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
  processedById?: string;
  processedByName?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class IngredientRequestService {
  private getStorageKey(branchId: string): string {
    return `kitchen.ingredient_requests.${branchId || 'default'}`;
  }

  private async getRequests(branchId: string): Promise<IngredientRequestItem[]> {
    try {
      const key = this.getStorageKey(branchId);
      const setting = await prisma.setting.findUnique({
        where: { key },
      });

      if (!setting || !Array.isArray(setting.value)) {
        return [];
      }

      return setting.value as unknown as IngredientRequestItem[];
    } catch (error) {
      console.error('Error fetching ingredient requests:', error);
      return [];
    }
  }

  private async saveRequests(branchId: string, requests: IngredientRequestItem[]): Promise<void> {
    const key = this.getStorageKey(branchId);
    await prisma.setting.upsert({
      where: { key },
      update: { value: requests as any },
      create: { key, value: requests as any },
    });
  }

  async getAll(params: { branchId?: string; status?: string }) {
    const branchId = params.branchId || '';
    const all = await this.getRequests(branchId);

    let filtered = all;
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((r) => r.status.toUpperCase() === params.status?.toUpperCase());
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  }

  async create(data: {
    branchId: string;
    inventoryId: string;
    quantity: number;
    priority?: 'NORMAL' | 'URGENT';
    notes?: string;
    user: any;
  }) {
    if (!data.inventoryId) {
      throw new ApiError(400, 'Inventory item is required');
    }
    if (!data.quantity || data.quantity <= 0) {
      throw new ApiError(400, 'Quantity must be greater than 0');
    }

    // Look up the inventory item
    const inventoryItem = await prisma.inventory.findUnique({
      where: { id: data.inventoryId },
    });

    if (!inventoryItem) {
      throw new ApiError(404, 'Inventory item not found');
    }

    const branchId = data.branchId || inventoryItem.branchId || data.user?.branchId || '';
    const currentRequests = await this.getRequests(branchId);

    const userName = data.user
      ? `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.username || 'Staff'
      : 'Kitchen Staff';

    const newRequest: IngredientRequestItem = {
      id: `ir-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      requestNumber: `REQ-${Date.now().toString().slice(-6)}`,
      branchId,
      requestedById: data.user?.id || '',
      requestedByName: userName,
      inventoryId: inventoryItem.id,
      inventoryName: inventoryItem.name,
      quantity: Number(data.quantity),
      unit: inventoryItem.unit,
      priority: data.priority || 'NORMAL',
      notes: data.notes || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    currentRequests.unshift(newRequest);
    await this.saveRequests(branchId, currentRequests);

    // Broadcast WebSocket notification to store / managers
    try {
      const io = websocketService.getIO();
      if (io) {
        io.to(`branch:${branchId}`).emit('ingredientRequest:created', {
          request: newRequest,
          message: `Kitchen requested ${newRequest.quantity} ${newRequest.unit} of ${newRequest.inventoryName}`,
        });
      }
    } catch (wsErr) {
      console.warn('Could not emit ingredientRequest:created WebSocket:', wsErr);
    }

    return newRequest;
  }

  async approve(id: string, user: any) {
    const branchId = user?.branchId || '';
    const requests = await this.getRequests(branchId);
    const index = requests.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new ApiError(404, 'Ingredient request not found');
    }

    const request = requests[index];

    if (request.status !== 'PENDING') {
      throw new ApiError(400, `Request is already ${request.status}`);
    }

    // Check inventory stock and deduct
    const inventoryItem = await prisma.inventory.findUnique({
      where: { id: request.inventoryId },
    });

    if (!inventoryItem) {
      throw new ApiError(404, 'Inventory item not found');
    }

    if (inventoryItem.quantity < request.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock to issue request. Available: ${inventoryItem.quantity} ${inventoryItem.unit}`
      );
    }

    // 1. Deduct stock from inventory
    await prisma.inventory.update({
      where: { id: request.inventoryId },
      data: {
        quantity: inventoryItem.quantity - request.quantity,
      },
    });

    // 2. Record inventory movement OUT
    await prisma.inventoryMovement.create({
      data: {
        inventoryId: request.inventoryId,
        type: 'OUT',
        quantity: request.quantity,
        reference: request.requestNumber,
        notes: `Kitchen requisition issued to ${request.requestedByName}${request.notes ? ` (${request.notes})` : ''}`,
      },
    });

    // 3. Mark request APPROVED
    const approverName = user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Manager'
      : 'Store Manager';

    request.status = 'APPROVED';
    request.processedById = user?.id || '';
    request.processedByName = approverName;
    request.processedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();

    requests[index] = request;
    await this.saveRequests(branchId, requests);

    // Broadcast WebSocket notification to kitchen
    try {
      const io = websocketService.getIO();
      if (io) {
        io.to(`branch:${branchId}`).emit('ingredientRequest:updated', {
          request,
          message: `Ingredient Request #${request.requestNumber} approved and issued!`,
        });
      }
    } catch (wsErr) {
      console.warn('Could not emit ingredientRequest:updated WebSocket:', wsErr);
    }

    return request;
  }

  async reject(id: string, reason: string, user: any) {
    const branchId = user?.branchId || '';
    const requests = await this.getRequests(branchId);
    const index = requests.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new ApiError(404, 'Ingredient request not found');
    }

    const request = requests[index];

    if (request.status !== 'PENDING') {
      throw new ApiError(400, `Request is already ${request.status}`);
    }

    const rejecterName = user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Manager'
      : 'Store Manager';

    request.status = 'REJECTED';
    request.rejectionReason = reason || 'Not available in store';
    request.processedById = user?.id || '';
    request.processedByName = rejecterName;
    request.processedAt = new Date().toISOString();
    request.updatedAt = new Date().toISOString();

    requests[index] = request;
    await this.saveRequests(branchId, requests);

    try {
      const io = websocketService.getIO();
      if (io) {
        io.to(`branch:${branchId}`).emit('ingredientRequest:updated', {
          request,
          message: `Ingredient Request #${request.requestNumber} rejected: ${request.rejectionReason}`,
        });
      }
    } catch (wsErr) {
      console.warn('Could not emit ingredientRequest:updated WebSocket:', wsErr);
    }

    return request;
  }

  async cancel(id: string, user: any) {
    const branchId = user?.branchId || '';
    const requests = await this.getRequests(branchId);
    const index = requests.findIndex((r) => r.id === id);

    if (index === -1) {
      throw new ApiError(404, 'Ingredient request not found');
    }

    const request = requests[index];

    if (request.status !== 'PENDING') {
      throw new ApiError(400, `Cannot cancel request that is already ${request.status}`);
    }

    request.status = 'CANCELLED';
    request.updatedAt = new Date().toISOString();

    requests[index] = request;
    await this.saveRequests(branchId, requests);

    return request;
  }
}

