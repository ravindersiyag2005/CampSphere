import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { ToastService } from '../../core/services/toast.service';
import { StaggerInDirective } from '../../shared/components/stagger-in.directive';

@Component({
  selector: 'app-chat-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StaggerInDirective],
  template: `
    <div class="page page--chat">
      <div class="page-header">
        <div>
          <div class="eyebrow">Anonymous Chat</div>
          <h1>Talk freely, stay anonymous</h1>
          <p class="text-muted">
            Everyone sees you as a random alias, not your real name. Messages are moderated —
            abusive content gets flagged and reviewed by admins.
          </p>
        </div>
        <button class="btn btn-primary" (click)="showForm.set(!showForm())">
          {{ showForm() ? 'Close' : '+ New room' }}
        </button>
      </div>

      <div class="card mt-16" *ngIf="showForm()">
        <h3>Create a group room</h3>
        <form (ngSubmit)="submit()" #f="ngForm" class="form-grid">
          <div class="field">
            <label>Room name</label>
            <input class="input" name="name" [(ngModel)]="form.name" required placeholder="e.g. Hostel Block D" />
          </div>
          <div class="field">
            <label>Subject / topic</label>
            <input class="input" name="subject" [(ngModel)]="form.subject" placeholder="e.g. General" />
          </div>
          <div class="field" style="grid-column: 1/-1">
            <label>Description</label>
            <input class="input" name="description" [(ngModel)]="form.description" placeholder="What's this room for?" />
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="saving() || f.invalid">
            <span class="spinner" *ngIf="saving()"></span> {{ saving() ? 'Creating…' : 'Create room' }}
          </button>
        </form>
      </div>

      <h2 class="section-title mt-24">Group rooms</h2>
      <div class="grid grid-cols-3 mt-8" appStaggerIn *ngIf="!loadingRooms(); else loadingTpl">
        <a class="card card-hover card-accent-violet room-card" *ngFor="let r of rooms()" [routerLink]="['/chat/room', r._id]">
          <svg class="room-card-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <h3>{{ r.name }}</h3>
          <span class="badge badge-violet">{{ r.subject }}</span>
          <p class="text-sm text-muted mt-8">{{ r.description || 'Anonymous group chat' }}</p>
        </a>
      </div>
      <p class="text-muted text-sm mt-8" *ngIf="!loadingRooms() && rooms().length === 0">
        No group rooms available. Be the first to create one!
      </p>

      <ng-template #loadingTpl>
        <div class="grid grid-cols-3 mt-8">
          <div class="skeleton" style="height: 140px" *ngFor="let i of [1,2,3]"></div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; align-items: end; }
    .section-title { font-size: 18px; }
    .room-card { text-decoration: none; }
    .room-card-icon {
      width: 20px;
      height: 20px;
      stroke: var(--violet);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      margin-bottom: 8px;
      filter: drop-shadow(0 0 4px rgba(0, 242, 254, 0.4));
      display: inline-block;
    }
  `],
})
export class ChatRoomsComponent implements OnInit {
  rooms = signal<any[]>([]);
  loadingRooms = signal(true);
  saving = signal(false);
  showForm = signal(false);

  form = { name: '', subject: 'General', description: '' };

  constructor(private chatService: ChatService, private toast: ToastService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loadingRooms.set(true);
    this.chatService.listRooms().subscribe({
      next: (data) => { this.rooms.set(data); this.loadingRooms.set(false); },
      error: () => this.loadingRooms.set(false),
    });
  }

  submit() {
    this.saving.set(true);
    this.chatService.createRoom(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toast.success('Room created!');
        this.form = { name: '', subject: 'General', description: '' };
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }
}
