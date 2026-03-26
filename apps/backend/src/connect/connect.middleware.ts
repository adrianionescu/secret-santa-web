import { Injectable, NestMiddleware } from '@nestjs/common';
import { connectNodeAdapter } from '@connectrpc/connect-node';
import { SessionService as SessionServiceDef } from '@secret-santa/proto';
import { SessionConnectHandler } from '../session/session-connect.handler';
import { IncomingMessage, ServerResponse } from 'http';

@Injectable()
export class ConnectMiddleware implements NestMiddleware {
  private readonly handler: (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => void;

  constructor(private readonly sessionConnectHandler: SessionConnectHandler) {
    const handlers = this.sessionConnectHandler.getHandlers();
    this.handler = connectNodeAdapter({
      routes(router) {
        router.service(SessionServiceDef, handlers);
      },
    });
  }

  use(req: any, res: any, next: () => void) {
    this.handler(req, res, next);
  }
}
