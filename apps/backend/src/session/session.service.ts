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

  async deleteAllSessions(): Promise<void> {
    return this.sessionRepository.deleteAll();
  }

  async saveSession(
    name: string,
    participants: string[],
    pairs: string,
    createdAt?: string,
  ): Promise<SessionModel> {
    const exists = await this.sessionRepository.existsByName(name);
    if (exists) {
      throw new BadRequestException(
        `A session with the name "${name}" already exists.`,
      );
    }

    const session: SessionModel = {
      name,
      createdAt: createdAt ?? new Date().toISOString(),
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
    const idMap = this.generateUniqueIds(participants, previousPairs);

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
        giverId: idMap.get(giver) as string,
        receiverId: idMap.get(receivers[i]) as string,
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

  private static readonly ANIMAL_IDS = [
    'marmota', 'pisica', 'suricata', 'veverita', 'capybara',
    'panda rosu', 'vulpe fennec', 'chinchilla', 'quokka', 'axolotl',
  ];

  private generateUniqueIds(participants: string[], previousPairs: Pair[]): Map<string, string> {
    if (participants.length > SessionService.ANIMAL_IDS.length) {
      throw new Error(
        `Too many participants: maximum is ${SessionService.ANIMAL_IDS.length}.`,
      );
    }
    const previousAnimal = new Map(previousPairs.map((p) => [p.giver, p.giverId]));

    for (let attempt = 0; attempt < 100; attempt++) {
      const pool = [...SessionService.ANIMAL_IDS];
      const map = new Map<string, string>();
      let valid = true;

      for (const p of participants) {
        const available = pool.filter((a) => a !== previousAnimal.get(p));
        if (available.length === 0) { valid = false; break; }
        const animal = available[Math.floor(Math.random() * available.length)];
        pool.splice(pool.indexOf(animal), 1);
        map.set(p, animal);
      }

      if (valid) return map;
    }

    // Fallback: assign ignoring previous constraint rather than failing
    const pool = [...SessionService.ANIMAL_IDS];
    const map = new Map<string, string>();
    for (const p of participants) {
      const index = Math.floor(Math.random() * pool.length);
      map.set(p, pool.splice(index, 1)[0]);
    }
    return map;
  }
}
