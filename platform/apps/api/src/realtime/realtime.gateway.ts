import { Logger, UnauthorizedException } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { ConfigService } from "@nestjs/config";

const jwt: {
  verify: (token: string, secret: string) => unknown;
} = require("jsonwebtoken");

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? (process.env.ALLOWED_ORIGINS || "")
            .split(",")
            .map(o => o.trim())
            .filter(Boolean)
        : true,
    credentials: true
  }
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly configService: ConfigService) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace("Bearer ", "") ||
      client.handshake.query?.token;

    if (!token) {
      this.logger.warn(`Unauthenticated realtime connection rejected: ${client.id}`);
      client.disconnect(true);
      return;
    }

    try {
      const accessSecret =
        this.configService.get<string>("JWT_ACCESS_SECRET") || "replace-me";
      const payload = jwt.verify(token, accessSecret) as {
        sub: string;
        roles: string[];
        sessionId: string;
      };
      (client as any).user = payload;
      this.logger.debug(
        `Realtime client connected: ${client.id} (user: ${payload.sub})`
      );
    } catch {
      this.logger.warn(`Invalid token on realtime connection: ${client.id}`);
      client.disconnect(true);
    }
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
