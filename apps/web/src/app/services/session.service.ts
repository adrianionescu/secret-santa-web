import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import {
  SessionService as SessionServiceDef,
  Session,
} from '@secret-santa/proto';
import { environment } from '../../environments/environment';

export interface Pair {
  giver: string;
  receiver: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly client = createClient(
    SessionServiceDef,
    createConnectTransport({ baseUrl: environment.apiUrl })
  );

  generatePairs(participants: string[]): Observable<{ pairs: string; participants: string[] }> {
    return from(this.client.generatePairs({ participants })).pipe(
      map(res => ({ pairs: res.pairs, participants: res.participants as string[] }))
    );
  }

  saveSession(name: string, participants: string[], pairs: string): Observable<Session> {
    return from(this.client.saveSession({ name, participants, pairs })).pipe(
      map(res => res.session!)
    );
  }

  listSessions(): Observable<Session[]> {
    return from(this.client.listSessions({})).pipe(
      map(res => res.sessions as Session[])
    );
  }

  getLatestSession(): Observable<Session | null> {
    return from(this.client.getLatestSession({})).pipe(
      map(res => (res.found && res.session) ? res.session : null)
    );
  }

  parsePairs(pairsJson: string): Pair[] {
    try {
      return JSON.parse(pairsJson);
    } catch {
      return [];
    }
  }
}
