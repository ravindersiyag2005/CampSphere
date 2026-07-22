import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from '../../core/services/event.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AnimationService } from '../../core/services/animation.service';
import { StaggerInDirective } from '../../shared/components/stagger-in.directive';

const CATEGORY_ACCENT: Record<string, string> = {
  technical: 'violet',
  cultural: 'pink',
  sports: 'teal',
  workshop: 'amber',
  seminar: 'coral',
  other: 'violet',
};

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, StaggerInDirective],
  template: `
    <div class="page page--events">
      <div class="page-header">
        <div>
          <div class="eyebrow">Campus Events</div>
          <h1>What's happening around campus</h1>
          <p class="text-muted">Events disappear automatically a few hours after they end — no stale listings.</p>
        </div>
        <button class="btn btn-primary" (click)="showForm.set(!showForm())">
          {{ showForm() ? 'Close' : '+ Post an event' }}
        </button>
      </div>

      <div class="card mt-16" *ngIf="showForm()">
        <h3>Create an event</h3>
        <form (ngSubmit)="submit()" #f="ngForm" class="form-grid">
          <div class="field">
            <label>Title</label>
            <input class="input" name="title" [(ngModel)]="form.title" required placeholder="e.g. Robotics Workshop" />
          </div>
          <div class="field">
            <label>Category</label>
            <select class="select" name="category" [(ngModel)]="form.category">
              <option value="technical">Technical</option>
              <option value="cultural">Cultural</option>
              <option value="sports">Sports</option>
              <option value="workshop">Workshop</option>
              <option value="seminar">Seminar</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="field">
            <label>Location</label>
            <input class="input" name="location" [(ngModel)]="form.location" required placeholder="e.g. Block D Auditorium" />
          </div>
          <div class="field">
            <label>Date &amp; time</label>
            <input class="input" type="datetime-local" name="eventDateTime" [(ngModel)]="form.eventDateTime" required />
          </div>
          <div class="field" style="grid-column: 1/-1">
            <label>Description</label>
            <textarea class="input" name="description" [(ngModel)]="form.description" placeholder="What's it about?"></textarea>
          </div>
          <button class="btn btn-coral" type="submit" [disabled]="saving() || f.invalid">
            <span class="spinner" *ngIf="saving()"></span> {{ saving() ? 'Posting…' : 'Post event' }}
          </button>
        </form>
      </div>

      <div class="grid grid-cols-3 mt-24" appStaggerIn *ngIf="!loading(); else loadingTpl">
        <div class="card card-hover" [class]="'card-accent-' + accent(e.category)" *ngFor="let e of events()">
          <span class="badge" [class]="'badge-' + accent(e.category)">{{ e.category }}</span>
          <h3 class="mt-8">{{ e.title }}</h3>
          <p class="text-sm text-muted">{{ e.description || 'No description provided.' }}</p>
          <div class="meta-row">📍 {{ e.location }}</div>
          <div class="meta-row">🕒 {{ e.eventDateTime | date:'EEE, MMM d, y • h:mm a' }}</div>

          <div class="flex justify-between items-center mt-16">
            <button class="btn btn-sm" [class]="isInterested(e) ? 'btn-teal' : 'btn-ghost'" (click)="toggleInterest(e, $event)">
              ⭐ {{ isInterested(e) ? 'Interested' : 'I\\'m interested' }} · {{ e.interestedUsers.length }}
            </button>
            <button class="btn btn-danger btn-sm" *ngIf="canDelete(e)" (click)="remove(e)">Remove</button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading() && events().length === 0">
        <svg class="empty-state-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="14" r="2"/></svg>
        <p>No upcoming events right now. Be the first to post one!</p>
      </div>

      <ng-template #loadingTpl>
        <div class="grid grid-cols-3 mt-16">
          <div class="skeleton" style="height: 190px" *ngFor="let i of [1,2,3,4,5,6]"></div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; align-items: end; }
    .meta-row { font-size: 13.5px; color: var(--text-muted); margin-top: 4px; }
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; gap: 12px; }
      .page-header .btn { width: 100%; margin-top: 12px; }
    }
  `],
})
export class EventsComponent implements OnInit {
  events = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);

  form = { title: '', category: 'technical', location: '', eventDateTime: '', description: '' };

  constructor(private eventService: EventService, public auth: AuthService, private toast: ToastService, private anim: AnimationService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.eventService.list().subscribe({
      next: (data) => { this.events.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  submit() {
    this.saving.set(true);
    this.eventService.create(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toast.success('Event posted!');
        this.form = { title: '', category: 'technical', location: '', eventDateTime: '', description: '' };
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  toggleInterest(e: any, event: MouseEvent) {
    this.anim.pulse(event.currentTarget as Element);
    this.eventService.toggleInterest(e._id).subscribe((res) => {
      if (res.interested) e.interestedUsers.push(this.auth.currentUser()?.id);
      else e.interestedUsers = e.interestedUsers.filter((id: string) => id !== this.auth.currentUser()?.id);
    });
  }

  isInterested(e: any): boolean {
    return e.interestedUsers?.includes(this.auth.currentUser()?.id);
  }

  canDelete(e: any): boolean {
    const u = this.auth.currentUser();
    return !!u && (u.id === e.organizer?._id || u.role === 'admin');
  }

  remove(e: any) {
    this.eventService.remove(e._id).subscribe(() => {
      this.toast.success('Event removed');
      this.events.set(this.events().filter((x) => x._id !== e._id));
    });
  }

  accent(category: string): string {
    return CATEGORY_ACCENT[category] || 'violet';
  }
}
