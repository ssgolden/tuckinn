import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true
  }
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    this.logger.debug(`Realtime client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Realtime client disconnected: ${client.id}`);
  }

  emitBoardRefresh(payload?: Record<string, unknown>) {
    this.server.emit("board:refresh", {
      triggeredAt: new Date().toISOString(),
      ...(payload ?? {})
    });
  }

  emitOrderUpdated(payload: {
    orderId: string;
    orderNumber: string;
    status: string;
    source: "fulfillment" | "payments";
  }) {
    this.server.emit("order:updated", {
      triggeredAt: new Date().toISOString(),
      ...payload
    });
  }
}
