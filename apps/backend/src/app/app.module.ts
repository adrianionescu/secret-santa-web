import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionModule } from '../session/session.module';
import { RepositoryModule } from '../repository/repository.module';
import { ConnectMiddleware } from '../connect/connect.middleware';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RepositoryModule.forRoot(),
    SessionModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ConnectMiddleware).exclude('health').forRoutes('*');
  }
}
