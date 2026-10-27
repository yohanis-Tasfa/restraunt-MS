import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../middleware/auth';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  restaurantId?: string;
  branchId?: string;
  role?: string;
}

class WebSocketService {
  private io: Server | null = null;
  private orderNotificationTimers: Map<string, NodeJS.Timeout[]> = new Map(); // Track timers by orderId

  initialize(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
      },
    });

    // Authentication middleware for WebSocket
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = verifyToken(token) as any;
        
        if (!decoded || !decoded.userId) {
          return next(new Error('Authentication error: Invalid token'));
        }

        // Attach user info to socket
        socket.userId = decoded.userId;
        socket.restaurantId = decoded.restaurantId;
        socket.branchId = decoded.branchId;
        socket.role = decoded.role;

        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`WebSocket client connected: ${socket.id} (User: ${socket.userId})`);

      // Join rooms based on restaurant and branch
      if (socket.restaurantId) {
        socket.join(`restaurant:${socket.restaurantId}`);
        console.log(`Socket ${socket.id} joined restaurant:${socket.restaurantId}`);
      }

      if (socket.branchId) {
        socket.join(`branch:${socket.branchId}`);
        console.log(`Socket ${socket.id} joined branch:${socket.branchId}`);
      }

      // Join user-specific room
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
        console.log(`Socket ${socket.id} joined user:${socket.userId}`);
      }

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`WebSocket client disconnected: ${socket.id}`);
      });

      // Handle ping/pong for connection health check
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    console.log('WebSocket server initialized');
  }

  // Emit waiter call events
  emitWaiterCallCreated(call: any, branchId: string, restaurantId: string) {
    if (!this.io) return;

    // Emit to all clients in the branch
    if (branchId) {
      this.io.to(`branch:${branchId}`).emit('waiter-call:created', call);
    }
    
    // Also emit to restaurant room (for multi-branch support)
    if (restaurantId) {
      this.io.to(`restaurant:${restaurantId}`).emit('waiter-call:created', call);
    }

    // Direct room for assigned waiter
    if (call.waiterId) {
      this.io.to(`user:${call.waiterId}`).emit('waiter-call:created', call);
    }
    
    console.log(`Emitted waiter-call:created to branch:${branchId}`);
  }

  emitWaiterCallAcknowledged(call: any, branchId: string, restaurantId: string) {
    if (!this.io) return;

    this.io.to(`branch:${branchId}`).emit('waiter-call:acknowledged', call);
    this.io.to(`restaurant:${restaurantId}`).emit('waiter-call:acknowledged', call);
    
    console.log(`Emitted waiter-call:acknowledged to branch:${branchId}`);
  }

  emitWaiterCallCompleted(call: any, branchId: string, restaurantId: string) {
    if (!this.io) return;

    this.io.to(`branch:${branchId}`).emit('waiter-call:completed', call);
    this.io.to(`restaurant:${restaurantId}`).emit('waiter-call:completed', call);
    
    console.log(`Emitted waiter-call:completed to branch:${branchId}`);
  }

  emitWaiterCallCancelled(call: any, branchId: string, restaurantId: string) {
    if (!this.io) return;

    this.io.to(`branch:${branchId}`).emit('waiter-call:cancelled', call);
    this.io.to(`restaurant:${restaurantId}`).emit('waiter-call:cancelled', call);
    
    console.log(`Emitted waiter-call:cancelled to branch:${branchId}`);
  }

  emitWaiterCallUpdated(call: any, branchId: string, restaurantId: string) {
    if (!this.io) return;

    this.io.to(`branch:${branchId}`).emit('waiter-call:updated', call);
    this.io.to(`restaurant:${restaurantId}`).emit('waiter-call:updated', call);
    
    console.log(`Emitted waiter-call:updated to branch:${branchId}`);
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit(event, data);
    console.log(`Emitted ${event} to user:${userId}`);
  }

  // Bill Request events
  emitBillRequestCreated(billRequest: any, branchId: string, restaurantId: string) {
    if (!this.io) return;

    const data = {
      billRequest,
      message: `New bill request from Table ${billRequest.table?.number || 'N/A'}`,
      type: 'created',
    };

    // Emit to all clients in the branch (Cashiers will receive this)
    this.io.to(`branch:${branchId}`).emit('billRequest:created', data);
    this.io.to(`restaurant:${restaurantId}`).emit('billRequest:created', data);
    
    console.log(`Emitted billRequest:created to branch:${branchId}`);
  }

  emitBillRequestProcessed(billRequest: any, branchId: string, restaurantId: string) {
    if (!this.io) return;

    const data = {
      billRequest,
      message: `Bill request for Table ${billRequest.table?.number || 'N/A'} is being processed`,
      type: 'processed',
    };

    // Emit to branch and the specific waiter who created the request
    this.io.to(`branch:${branchId}`).emit('billRequest:processed', data);
    this.io.to(`restaurant:${restaurantId}`).emit('billRequest:processed', data);
    
    if (billRequest.requestedById) {
      this.io.to(`user:${billRequest.requestedById}`).emit('billRequest:processed', data);
    }
    
    console.log(`Emitted billRequest:processed to branch:${branchId}`);
  }

  emitBillRequestCompleted(billRequest: any, branchId: string, restaurantId: string) {
    if (!this.io) return;

    const data = {
      billRequest,
      message: `Bill ready for Table ${billRequest.table?.number || 'N/A'}`,
      type: 'completed',
    };

    // Emit to branch and the specific waiter who created the request
    this.io.to(`branch:${branchId}`).emit('billRequest:completed', data);
    this.io.to(`restaurant:${restaurantId}`).emit('billRequest:completed', data);
    
    if (billRequest.requestedById) {
      this.io.to(`user:${billRequest.requestedById}`).emit('billRequest:completed', data);
    }
    
    console.log(`Emitted billRequest:completed to branch:${branchId}`);
  }

  emitBillRequestCancelled(billRequest: any, branchId: string, restaurantId: string) {
    if (!this.io) return;

    const data = {
      billRequest,
      message: `Bill request for Table ${billRequest.table?.number || 'N/A'} was cancelled`,
      type: 'cancelled',
    };

    // Emit to branch and the specific waiter who created the request
    this.io.to(`branch:${branchId}`).emit('billRequest:cancelled', data);
    this.io.to(`restaurant:${restaurantId}`).emit('billRequest:cancelled', data);
    
    if (billRequest.requestedById) {
      this.io.to(`user:${billRequest.requestedById}`).emit('billRequest:cancelled', data);
    }
    
    console.log(`Emitted billRequest:cancelled to branch:${branchId}`);
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.io ? this.io.sockets.sockets.size : 0;
  }

  // Tip notification events
  emitTipReceived(tip: any, waiterId: string, branchId: string, restaurantId: string) {
    if (!this.io) return;

    const data = {
      tip,
      message: `You received a ${tip.amount.toFixed(2)} ETB tip from ${tip.method === 'CASH' ? 'cash' : 'transfer'} payment!`,
      type: 'received',
    };

    // Emit to the specific waiter who received the tip
    this.io.to(`user:${waiterId}`).emit('tip:received', data);
    
    // Also emit to branch for managers to track
    this.io.to(`branch:${branchId}`).emit('tip:created', data);
    
    console.log(`Emitted tip:received to user:${waiterId} - Amount: ${tip.amount} ETB`);
  }

  emitTipPaid(tip: any, waiterId: string, branchId: string, restaurantId: string) {
    if (!this.io) return;

    const data = {
      tip,
      message: `Your ${tip.amount.toFixed(2)} ETB tip has been paid out!`,
      type: 'paid',
    };

    // Emit to the specific waiter
    this.io.to(`user:${waiterId}`).emit('tip:paid', data);
    
    console.log(`Emitted tip:paid to user:${waiterId} - Amount: ${tip.amount} ETB`);
  }

  // Order ready notification events with smart escalation
  emitOrderReady(order: any, waiterId: string, branchId: string, restaurantId: string) {
    if (!this.io) return;

    const orderId = order.id;
    const timers: NodeJS.Timeout[] = [];

    const data = {
      order,
      message: `Order #${order.orderNumber} is ready! Table ${order.table?.number || 'N/A'} - ${order.itemsCount || 0} items`,
      type: 'ready',
      timestamp: new Date().toISOString(),
    };

    // Emit initial notification to the specific waiter who created the order (if known)
    if (waiterId) {
      this.io.to(`user:${waiterId}`).emit('order:ready', data);
    }

    // Also broadcast to the branch and restaurant so active waiters/managers receive it
    if (branchId) {
      this.io.to(`branch:${branchId}`).emit('order:ready', data);
    }
    if (restaurantId) {
      this.io.to(`restaurant:${restaurantId}`).emit('order:ready', data);
    }
    console.log(`Emitted order:ready to branch:${branchId} & user:${waiterId} - Order: ${order.orderNumber}`);

    // Schedule reminder notifications every 30 seconds (at 30s, 60s, 90s)
    const reminderIntervals = [30000, 60000, 90000]; // 30s, 60s, 90s in milliseconds
    
    reminderIntervals.forEach((delay, index) => {
      const timer = setTimeout(() => {
        const reminderData = {
          ...data,
          message: `🔔 Reminder: Order #${order.orderNumber} still waiting! Table ${order.table?.number || 'N/A'}`,
          type: 'ready_reminder',
          reminderCount: index + 1,
        };

        // Send reminder only to assigned waiter
        this.io?.to(`user:${waiterId}`).emit('order:ready:reminder', reminderData);
        console.log(`Sent reminder ${index + 1} to user:${waiterId} - Order: ${order.orderNumber}`);
      }, delay);
      
      timers.push(timer);
    });

    // Schedule escalation notification after 2 minutes if not acknowledged
    const escalationTimer = setTimeout(() => {
      const escalationData = {
        ...data,
        message: `🚨 URGENT: Order #${order.orderNumber} has been waiting 2 minutes! Table ${order.table?.number || 'N/A'}`,
        type: 'ready_escalation',
        escalated: true,
      };

      // Broadcast to entire branch (all staff can help)
      this.io?.to(`branch:${branchId}`).emit('order:ready:escalation', escalationData);
      
      console.log(`Escalated order:ready to branch:${branchId} - Order: ${order.orderNumber} (2 min timeout)`);
      
      // Clean up timers after escalation
      this.orderNotificationTimers.delete(orderId);
    }, 120000); // 2 minutes = 120000ms
    
    timers.push(escalationTimer);

    // Store timers so they can be cancelled later
    this.orderNotificationTimers.set(orderId, timers);
  }

  // Cancel all pending notifications for an order (when it's served/completed)
  cancelOrderNotifications(orderId: string) {
    const timers = this.orderNotificationTimers.get(orderId);
    
    if (timers) {
      timers.forEach(timer => clearTimeout(timer));
      this.orderNotificationTimers.delete(orderId);
      console.log(`Cancelled all pending notifications for order: ${orderId}`);
    }
  }

  // Get instance
  getIO(): Server | null {
    return this.io;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
