import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  ISessionRepository,
  Pair,
  SESSION_REPOSITORY_TOKEN,
  SessionModel,
} from '@secret-santa/shared';

@Injectable()
export class SessionService {
  constructor(
    @Inject(SESSION_REPOSITORY_TOKEN)
    private readonly sessionRepository: ISessionRepository,
  ) {}

  async generatePairs(participants: string[]): Promise<string> {
    const latest = await this.sessionRepository.findMostRecent();
    let previousPairs: Pair[] = [];
    if (latest) {
      try {
        previousPairs = JSON.parse(latest.pairs) as Pair[];
      } catch {
        previousPairs = [];
      }
    }
    const pairs = this.generatePairsWithConstraints(participants, previousPairs);
    return JSON.stringify(pairs);
  }

  async listSessions(): Promise<SessionModel[]> {
    return this.sessionRepository.findAll();
  }

  async getLatestSession(): Promise<SessionModel | null> {
    return this.sessionRepository.findMostRecent();
  }

  async deleteSession(name: string): Promise<void> {
    return this.sessionRepository.deleteByName(name);
  }

  async saveSession(
    name: string,
    participants: string[],
    pairs: string,
  ): Promise<SessionModel> {
    const exists = await this.sessionRepository.existsByName(name);
    if (exists) {
      throw new BadRequestException(
        `A session with the name "${name}" already exists.`,
      );
    }

    const session: SessionModel = {
      name,
      createdAt: new Date().toISOString(),
      pairs,
      participants,
    };

    return this.sessionRepository.save(session);
  }

  private generatePairsWithConstraints(
    participants: string[],
    previousPairs: Pair[],
  ): Pair[] {
    const prevSet = new Set(
      previousPairs.map((p) => `${p.giver}:${p.receiver}`),
    );

    for (let attempt = 0; attempt < 100; attempt++) {
      const receivers = [...participants];
      // Fisher-Yates shuffle
      for (let i = receivers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
      }

      const pairs: Pair[] = participants.map((giver, i) => ({
        giver,
        receiver: receivers[i],
      }));

      // Check: no self-pairing, no repeat from previous session
      const valid = pairs.every(
        (p) =>
          p.giver !== p.receiver && !prevSet.has(`${p.giver}:${p.receiver}`),
      );

      if (valid) return pairs;
    }

    throw new Error('Could not generate valid pairs after 100 attempts');
  }
}
