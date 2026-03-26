import { SessionModel } from './session.model';

export interface ISessionRepository {
  findAll(): Promise<SessionModel[]>;          // ordered by createdAt desc
  findMostRecent(): Promise<SessionModel | null>;
  save(session: SessionModel): Promise<SessionModel>;
  existsByName(name: string): Promise<boolean>;
}

export const SESSION_REPOSITORY_TOKEN = Symbol('SESSION_REPOSITORY');
