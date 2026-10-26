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
    this.io.to(`branch:${branchId}`).emit('waiter-call:created', call);
    
    // Also emit to restaurant room (for multi-branch support)
    this.io.to(`restaurant:${restaurantId}`).emit('waiter-call:created', call);
    
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

  // Get instance
  getIO(): Server | null {
    return this.io;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
