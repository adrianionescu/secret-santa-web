import { Injectable } from '@nestjs/common';
import { create } from '@bufbuild/protobuf';
import {
  SessionService as SessionServiceDef,
  SessionSchema,
  GeneratePairsResponseSchema,
  SaveSessionResponseSchema,
  ListSessionsResponseSchema,
  GetLatestSessionResponseSchema,
  GeneratePairsRequest,
  SaveSessionRequest,
  ListSessionsRequest,
  GetLatestSessionRequest,
  GeneratePairsResponse,
  SaveSessionResponse,
  ListSessionsResponse,
  GetLatestSessionResponse,
} from '@secret-santa/proto';
import { SessionService } from './session.service';

@Injectable()
export class SessionConnectHandler {
  constructor(private readonly sessionService: SessionService) {}

  getHandlers(): typeof SessionServiceDef extends { typeName: string }
    ? Record<string, unknown>
    : never {
    const service = this.sessionService;

    return {
      async generatePairs(
        req: GeneratePairsRequest,
      ): Promise<GeneratePairsResponse> {
        const pairs = await service.generatePairs([...req.participants]);
        return create(GeneratePairsResponseSchema, {
          pairs,
          participants: req.participants,
        });
      },

      async saveSession(
        req: SaveSessionRequest,
      ): Promise<SaveSessionResponse> {
        const session = await service.saveSession(
          req.name,
          [...req.participants],
          req.pairs,
        );
        return create(SaveSessionResponseSchema, {
          session: create(SessionSchema, {
            name: session.name,
            createdAt: session.createdAt,
            pairs: session.pairs,
            participants: session.participants,
          }),
        });
      },

      async listSessions(
        _req: ListSessionsRequest,
      ): Promise<ListSessionsResponse> {
        const sessions = await service.listSessions();
        return create(ListSessionsResponseSchema, {
          sessions: sessions.map((s) =>
            create(SessionSchema, {
              name: s.name,
              createdAt: s.createdAt,
              pairs: s.pairs,
              participants: s.participants,
            }),
          ),
        });
      },

      async getLatestSession(
        _req: GetLatestSessionRequest,
      ): Promise<GetLatestSessionResponse> {
        const session = await service.getLatestSession();
        if (!session) {
          return create(GetLatestSessionResponseSchema, { found: false });
        }
        return create(GetLatestSessionResponseSchema, {
          found: true,
          session: create(SessionSchema, {
            name: session.name,
            createdAt: session.createdAt,
            pairs: session.pairs,
            participants: session.participants,
          }),
        });
      },
    } as ReturnType<SessionConnectHandler['getHandlers']>;
  }
}
