import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionFormComponent } from './components/session-form/session-form.component';
import { SessionListComponent } from './components/session-list/session-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SessionFormComponent, SessionListComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class AppComponent {
  @ViewChild(SessionListComponent) sessionList!: SessionListComponent;

  onSessionSaved() {
    // Refresh the sessions list when a new session is saved
    if (this.sessionList) {
      this.sessionList.load();
    }
  }
}
