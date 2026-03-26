import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SessionService, Pair } from '../../services/session.service';
import { SessionModel } from '@secret-santa/shared';

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './session-form.component.html',
  styleUrls: ['./session-form.component.css'],
})
export class SessionFormComponent implements OnInit {
  @Output() sessionSaved = new EventEmitter<SessionModel>();

  private readonly sessionService = inject(SessionService);

  names: string[] = [''];
  newName = '';
  generatedPairs: Pair[] | null = null;
  generatedPairsJson = '';
  generatedParticipants: string[] = [];
  generating = false;
  saving = false;
  sessionName = '';
  showSavePrompt = false;
  error = '';

  ngOnInit() {
    // Pre-fill names from the most recent session
    this.sessionService.getLatestSession().subscribe({
      next: (session) => {
        if (session && session.participants.length > 0) {
          this.names = [...session.participants];
        }
      },
      error: () => { /* ignore errors on initial load */ }
    });
  }

  addName() {
    if (this.newName.trim()) {
      this.names.push(this.newName.trim());
      this.newName = '';
    } else {
      this.names.push('');
    }
  }

  removeName(index: number) {
    this.names.splice(index, 1);
  }

  trackByIndex(index: number) { return index; }

  get validNames(): string[] {
    return this.names.map(n => n.trim()).filter(n => n.length > 0);
  }

  generatePairs() {
    const participants = this.validNames;
    if (participants.length < 2) {
      this.error = 'At least 2 participants are required.';
      return;
    }
    const unique = new Set(participants);
    if (unique.size !== participants.length) {
      this.error = 'All participant names must be unique.';
      return;
    }
    this.error = '';
    this.generating = true;
    this.sessionService.generatePairs(participants).subscribe({
      next: (res) => {
        this.generatedPairsJson = res.pairs;
        this.generatedParticipants = res.participants;
        this.generatedPairs = this.sessionService.parsePairs(res.pairs);
        this.generating = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to generate pairs.';
        this.generating = false;
      }
    });
  }

  promptSave() {
    if (!this.generatedPairsJson) {
      this.error = 'Generate pairs first.';
      return;
    }
    this.showSavePrompt = true;
    this.sessionName = '';
  }

  cancelSave() {
    this.showSavePrompt = false;
  }

  saveSession() {
    if (!this.sessionName.trim()) {
      this.error = 'Session name is required.';
      return;
    }
    this.error = '';
    this.saving = true;
    this.sessionService.saveSession(
      this.sessionName.trim(),
      this.generatedParticipants,
      this.generatedPairsJson
    ).subscribe({
      next: (session) => {
        this.saving = false;
        this.showSavePrompt = false;
        this.sessionName = '';
        this.generatedPairs = null;
        this.generatedPairsJson = '';
        this.sessionSaved.emit(session);
      },
      error: (err) => {
        this.error = err.message || 'Failed to save session.';
        this.saving = false;
      }
    });
  }
}
