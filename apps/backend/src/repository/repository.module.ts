import { DynamicModule, Module } from '@nestjs/common';
import { SESSION_REPOSITORY_TOKEN } from '@secret-santa/shared';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './mongo/session.schema';
import { MongoSessionRepository } from './mongo/mongo-session.repository';
import { FirestoreSessionRepository } from './firestore/firestore-session.repository';

@Module({})
export class RepositoryModule {
  static forRoot(): DynamicModule {
    const provider = process.env.DB_PROVIDER;

    if (provider === 'firestore') {
      return {
        module: RepositoryModule,
        global: true,
        providers: [
          FirestoreSessionRepository,
          {
            provide: SESSION_REPOSITORY_TOKEN,
            useExisting: FirestoreSessionRepository,
          },
        ],
        exports: [SESSION_REPOSITORY_TOKEN],
      };
    }

    // Default: mongo
    return {
      module: RepositoryModule,
      global: true,
      imports: [
        MongooseModule.forRoot(
          process.env.MONGO_URI || 'mongodb://localhost:27017/secretsanta',
        ),
        MongooseModule.forFeature([
          { name: Session.name, schema: SessionSchema },
        ]),
      ],
      providers: [
        MongoSessionRepository,
        {
          provide: SESSION_REPOSITORY_TOKEN,
          useExisting: MongoSessionRepository,
        },
      ],
      exports: [SESSION_REPOSITORY_TOKEN],
    };
  }
}
