import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TravelService } from '../../core/services/travel.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AnimationService } from '../../core/services/animation.service';
import { StaggerInDirective } from '../../shared/components/stagger-in.directive';

@Component({
  selector: 'app-travel',
  standalone: true,
  imports: [CommonModule, FormsModule, StaggerInDirective],
  template: `
    <div class="page page--travel">
      <div class="page-header">
        <div>
          <div class="eyebrow">Travel &amp; Trip Buddy</div>
          <h1>Going somewhere? Find a companion or split a ride</h1>
          <p class="text-muted">Posts auto-expire 12 hours after the travel time — no clutter from old trips.</p>
        </div>
        <button class="btn btn-primary" (click)="showForm.set(!showForm())">
          {{ showForm() ? 'Close' : '+ Post a trip' }}
        </button>
      </div>

      <div class="card mt-16" *ngIf="showForm()">
        <h3>Post a trip</h3>
        <form (ngSubmit)="submit()" #f="ngForm" class="form-grid">
          <div class="field">
            <label>Post type</label>
            <select class="select" name="type" [(ngModel)]="form.type">
              <option value="need-companion">I need a travel companion</option>
              <option value="sharing-ride">I'm sharing a ride (seats available)</option>
            </select>
          </div>
          <div class="field">
            <label>Travel mode</label>
            <select class="select" name="travelMode" [(ngModel)]="form.travelMode">
              <option value="train">Train</option>
              <option value="bus">Bus</option>
              <option value="flight">Flight</option>
              <option value="cab">Cab</option>
              <option value="shared-auto">Shared Auto</option>
              <option value="own-car">Own Car</option>
            </select>
          </div>
          <div class="field">
            <label>From</label>
            <input class="input" name="fromLocation" [(ngModel)]="form.fromLocation" required placeholder="e.g. LPU Campus" />
          </div>
          <div class="field">
            <label>To</label>
            <input class="input" name="toLocation" [(ngModel)]="form.toLocation" required placeholder="e.g. Delhi" />
          </div>
          <div class="field">
            <label>Date &amp; time</label>
            <input class="input" type="datetime-local" [min]="minDateTime" name="travelDateTime" [(ngModel)]="form.travelDateTime" required />
          </div>
          <div class="field" *ngIf="form.type === 'sharing-ride'">
            <label>Seats / max people</label>
            <input class="input" type="number" min="1" name="maxPeople" [(ngModel)]="form.maxPeople" placeholder="e.g. 3" />
          </div>
          <div class="field">
            <label>Approx cost sharing</label>
            <input class="input" name="costSharing" [(ngModel)]="form.costSharing" placeholder="e.g. ₹200/person" />
          </div>
          <div class="field" style="grid-column: 1/-1">
            <label>Notes</label>
            <textarea class="input" name="notes" [(ngModel)]="form.notes" placeholder="PNR confirmed, train no. 12345, flexible on time, etc."></textarea>
          </div>
          <button class="btn btn-teal" type="submit" [disabled]="saving() || f.invalid">
            <span class="spinner" *ngIf="saving()"></span> {{ saving() ? 'Posting…' : 'Post trip' }}
          </button>
        </form>
      </div>

      <div class="filters mt-24">
        <input class="input filter-input" placeholder="Filter by destination…" [(ngModel)]="toLocation" (ngModelChange)="load()" />
        <select class="select filter-select" [(ngModel)]="type" (ngModelChange)="load()">
          <option value="">All post types</option>
          <option value="need-companion">Need a companion</option>
          <option value="sharing-ride">Sharing a ride</option>
        </select>
      </div>

      <div class="grid grid-cols-3 mt-16" appStaggerIn *ngIf="!loading(); else loadingTpl">
        <div class="card card-hover" [class]="'card-accent-' + (t.type === 'sharing-ride' ? 'teal' : 'violet')" *ngFor="let t of posts()">
          <span class="badge" [class]="t.type === 'sharing-ride' ? 'badge-teal' : 'badge-violet'">
            {{ t.type === 'sharing-ride' ? 'Sharing a ride' : 'Needs a companion' }}
          </span>
          <h3 class="mt-8">{{ t.fromLocation }} → {{ t.toLocation }}</h3>
          <div class="meta-row">🚆 {{ t.travelMode }}</div>
          <div class="meta-row">🕒 {{ t.travelDateTime | date:'EEE, MMM d • h:mm a' }}</div>
          <div class="meta-row" *ngIf="t.costSharing">💰 {{ t.costSharing }}</div>
          <p class="text-sm text-muted mt-8" *ngIf="t.notes">{{ t.notes }}</p>

          <div class="flex items-center gap-8 mt-16">
            <div class="avatar avatar-sm" [style.background]="t.postedBy?.avatarColor || '#6C5CE7'">{{ initials(t.postedBy?.name) }}</div>
            <span class="text-sm text-muted">{{ t.postedBy?.name }}</span>
            <span class="badge badge-muted" *ngIf="t.type === 'sharing-ride'">{{ t.peopleJoined.length }}/{{ t.maxPeople }} joined</span>
          </div>

          <div class="flex justify-between items-center mt-16">
            <button *ngIf="!isCreator(t)" class="btn btn-sm" [class]="joined(t) ? 'btn-teal' : (requested(t) ? 'btn-outline' : (declined(t) ? 'btn-danger' : 'btn-primary'))" (click)="join(t, $event)" [disabled]="t.status === 'full' && !joined(t) && !requested(t)">
              {{ joined(t) ? '✓ Joined' : (requested(t) ? 'Request Sent' : (declined(t) ? 'Declined - Re-request' : (t.status === 'full' ? 'Full' : 'Join / Interested'))) }}
            </button>
            
            <button *ngIf="isCreator(t) && (t.requestedUsers?.length > 0 || t.peopleJoined?.length > 0)" class="btn btn-outline btn-sm" (click)="toggleMgmt(t._id)">
              {{ expandedRequests[t._id] ? 'Hide Management' : 'Manage Trip (' + t.requestedUsers.length + ' Pending)' }}
            </button>
            
            <button class="btn btn-danger btn-sm ml-auto" *ngIf="canDelete(t)" (click)="remove(t)">Remove Post</button>
          </div>

          <!-- Creator Management Section -->
          <div class="creator-mgmt mt-24" *ngIf="isCreator(t) && expandedRequests[t._id]">
            <div class="mgmt-divider"></div>
            
            <div *ngIf="t.requestedUsers?.length > 0" class="mb-16">
              <h4 class="section-title">Pending Requests</h4>
              <div class="request-item flex items-center justify-between gap-12" *ngFor="let reqUser of t.requestedUsers">
                <div class="flex items-center gap-8">
                  <div class="avatar avatar-sm" [style.background]="reqUser.avatarColor || '#6C5CE7'">{{ initials(reqUser.name) }}</div>
                  <span class="text-sm font-medium">{{ reqUser.name }}</span>
                </div>
                <div class="flex gap-8">
                  <button class="btn btn-sm btn-primary" (click)="acceptReq(t, reqUser._id)">Accept</button>
                  <button class="btn btn-sm btn-outline" (click)="declineReq(t, reqUser._id)">Decline</button>
                </div>
              </div>
            </div>

            <div *ngIf="t.peopleJoined?.length > 0">
              <h4 class="section-title">Accepted Travelers</h4>
              <div class="request-item flex justify-between items-center" *ngFor="let accUser of t.peopleJoined">
                <div class="flex items-center gap-8">
                  <div class="avatar avatar-sm" [style.background]="accUser.avatarColor || '#00B8A9'">{{ initials(accUser.name) }}</div>
                  <span class="text-sm font-medium">{{ accUser.name }}</span>
                </div>
                <button class="btn btn-sm btn-danger btn-outline" (click)="removePart(t, accUser._id)">Remove</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading() && posts().length === 0">
        <svg class="empty-state-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        <p>No trips posted yet. Going somewhere? Post it!</p>
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
    .filters { display: flex; gap: 12px; flex-wrap: wrap; }
    .filter-input { flex: 2; min-width: 220px; }
    .filter-select { flex: 1; min-width: 180px; }
    .meta-row { font-size: 13.5px; color: var(--text-muted); margin-top: 4px; }
    
    .mgmt-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 20px 0; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 12px; }
    
    .request-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 8px; transition: border-color 0.2s; }
    .request-item:hover { border-color: rgba(255,255,255,0.1); }
    .avatar-xs { width: 24px; height: 24px; font-size: 10px; }
    .btn-xs { padding: 2px 8px; font-size: 11px; }
    
    @media (max-width: 768px) {
      .form-grid { grid-template-columns: 1fr; gap: 12px; }
      .page-header .btn { width: 100%; margin-top: 12px; }
      .filters { flex-direction: column; }
      .filter-input, .filter-select { width: 100%; min-width: auto; }
    }
  `],
})
export class TravelComponent implements OnInit {
  posts = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  toLocation = '';
  type = '';

  expandedRequests: Record<string, boolean> = {};

  get minDateTime(): string {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  get defaultDateTime(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  form = {
    type: 'need-companion', travelMode: 'train', fromLocation: '', toLocation: '',
    travelDateTime: this.defaultDateTime, maxPeople: 1, costSharing: '', notes: '',
  };

  constructor(private travelService: TravelService, public auth: AuthService, private toast: ToastService, private anim: AnimationService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.travelService.list({ type: this.type, toLocation: this.toLocation }).subscribe({
      next: (data) => { this.posts.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  submit() {
    this.saving.set(true);
    this.travelService.create(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toast.success('Trip posted!');
        this.form = { type: 'need-companion', travelMode: 'train', fromLocation: '', toLocation: '', travelDateTime: this.defaultDateTime, maxPeople: 1, costSharing: '', notes: '' };
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  join(t: any, event: MouseEvent) {
    this.anim.pulse(event.currentTarget as Element);
    this.travelService.join(t._id).subscribe((updated) => {
      t.peopleJoined = updated.peopleJoined;
      t.requestedUsers = updated.requestedUsers;
      t.status = updated.status;
    });
  }

  toggleMgmt(tId: string) {
    this.expandedRequests[tId] = !this.expandedRequests[tId];
  }

  isCreator(t: any): boolean {
    const id = this.auth.currentUser()?.id;
    return !!id && (t.postedBy?._id || t.postedBy) === id;
  }

  requested(t: any) {
    if (!this.auth.currentUser()) return false;
    const myId = this.auth.currentUser()!.id;
    return t.requestedUsers?.some((u: any) => (u._id || u) === myId);
  }

  declined(t: any) {
    if (!this.auth.currentUser()) return false;
    const myId = this.auth.currentUser()!.id;
    return t.declinedUsers?.some((u: any) => (u._id || u) === myId);
  }

  joined(t: any): boolean {
    const id = this.auth.currentUser()?.id;
    return t.peopleJoined?.some((p: any) => (p._id || p) === id);
  }

  acceptReq(t: any, userId: string) {
    this.travelService.acceptRequest(t._id, userId).subscribe((updated) => {
      t.requestedUsers = updated.requestedUsers;
      t.peopleJoined = updated.peopleJoined;
      t.status = updated.status;
      this.toast.success('Request accepted');
    });
  }

  declineReq(t: any, userId: string) {
    this.travelService.declineRequest(t._id, userId).subscribe((updated) => {
      t.requestedUsers = updated.requestedUsers;
      this.toast.success('Request declined');
    });
  }

  removePart(t: any, userId: string) {
    this.travelService.removeParticipant(t._id, userId).subscribe((updated) => {
      t.peopleJoined = updated.peopleJoined;
      t.status = updated.status;
      this.toast.success('Participant removed');
    });
  }

  canDelete(t: any): boolean {
    const u = this.auth.currentUser();
    return !!u && (u.id === t.postedBy?._id || u.role === 'admin');
  }

  remove(t: any) {
    this.travelService.remove(t._id).subscribe(() => {
      this.toast.success('Trip removed');
      this.posts.set(this.posts().filter((x) => x._id !== t._id));
    });
  }

  initials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
