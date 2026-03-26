import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionConnectHandler } from './session-connect.handler';

@Module({
  providers: [SessionService, SessionConnectHandler],
  exports: [SessionConnectHandler],
})
export class SessionModule {}
