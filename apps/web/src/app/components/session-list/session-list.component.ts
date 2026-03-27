import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService, Pair } from '../../services/session.service';
import { SessionModel } from '@secret-santa/shared';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.css'],
})
export class SessionListComponent implements OnInit {
  private readonly sessionService = inject(SessionService);

  sessions: SessionModel[] = [];
  loading = false;
  error = '';
  confirmDeleteName: string | null = null;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.sessionService.listSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load sessions.';
        this.loading = false;
      }
    });
  }

  deleteSession(name: string) {
    this.confirmDeleteName = name;
  }

  confirmDelete() {
    const name = this.confirmDeleteName!;
    this.confirmDeleteName = null;
    this.sessionService.deleteSession(name).subscribe({
      next: () => this.load(),
      error: (err) => { this.error = err.message || 'Failed to delete session.'; }
    });
  }

  cancelDelete() {
    this.confirmDeleteName = null;
  }

  parsePairs(pairsJson: string): Pair[] {
    return this.sessionService.parsePairs(pairsJson);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }
}
