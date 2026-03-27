import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Pair, SessionModel } from '@secret-santa/shared';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly base = `${environment.apiUrl}/sessions`;
  private readonly http = inject(HttpClient);

  generatePairs(participants: string[]): Observable<{ pairs: string; participants: string[] }> {
    return this.http.post<{ pairs: string; participants: string[] }>(
      `${this.base}/generate-pairs`,
      { participants }
    );
  }

  saveSession(name: string, participants: string[], pairs: string): Observable<SessionModel> {
    return this.http.post<SessionModel>(this.base, { name, participants, pairs });
  }

  listSessions(): Observable<SessionModel[]> {
    return this.http.get<SessionModel[]>(this.base);
  }

  getLatestSession(): Observable<SessionModel | null> {
    return this.http.get<{ session: SessionModel | null; found: boolean }>(`${this.base}/latest`).pipe(
      map(res => res.found ? res.session : null)
    );
  }

  deleteSession(name: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(name)}`);
  }

  parsePairs(pairsJson: string): Pair[] {
    try {
      return JSON.parse(pairsJson);
    } catch {
      return [];
    }
  }
}
