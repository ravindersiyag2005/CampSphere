import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { ChatService } from '../../core/services/chat.service';
import { ToastService } from '../../core/services/toast.service';

type Tab = 'overview' | 'users' | 'chat' | 'reports' | 'blocklist';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="eyebrow">Admin Panel</div>
          <h1>Moderation &amp; oversight</h1>
          <p class="text-muted">Real identities are visible to you everywhere, including inside anonymous chat.</p>
        </div>
      </div>

      <div class="tabs">
        <button class="tab" [class.active]="tab() === 'overview'" (click)="setTab('overview')">Overview</button>
        <button class="tab" [class.active]="tab() === 'users'" (click)="setTab('users')">Users</button>
        <button class="tab" [class.active]="tab() === 'chat'" (click)="setTab('chat')">Chat Monitor</button>
        <button class="tab" [class.active]="tab() === 'reports'" (click)="setTab('reports')">Reports</button>
        <button class="tab" [class.active]="tab() === 'blocklist'" (click)="setTab('blocklist')">Blocked Words</button>
      </div>

      <!-- OVERVIEW -->
      <div class="grid grid-cols-3 mt-24" *ngIf="tab() === 'overview' && stats() as s">
        <div class="card card-accent-violet"><div class="stat-num">{{ s.totalUsers }}</div><div class="text-muted text-sm">Total students</div></div>
        <div class="card card-accent-coral"><div class="stat-num">{{ s.blockedUsers }}</div><div class="text-muted text-sm">Blocked accounts</div></div>
        <div class="card card-accent-amber"><div class="stat-num">{{ s.totalRooms }}</div><div class="text-muted text-sm">Chat rooms</div></div>
        <div class="card card-accent-teal"><div class="stat-num">{{ s.openReports }}</div><div class="text-muted text-sm">Open reports</div></div>
        <div class="card card-accent-pink"><div class="stat-num">{{ s.totalMessages }}</div><div class="text-muted text-sm">Messages sent</div></div>
      </div>

      <!-- USERS -->
      <div class="mt-24" *ngIf="tab() === 'users'">
        <div class="table-container" *ngIf="users().length; else emptyUsers">
          <table class="admin-table">
            <thead>
              <tr><th>Name</th><th>College ID</th><th>Email</th><th>Reputation</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of users()">
                <td>{{ u.name }}</td>
                <td class="mono">{{ u.collegeId }}</td>
                <td>{{ u.email }}</td>
                <td>{{ u.reputationScore }}</td>
                <td><span class="badge" [class]="u.isBlocked ? 'badge-coral' : 'badge-teal'">{{ u.isBlocked ? 'Blocked' : 'Active' }}</span></td>
                <td>
                  <button class="btn btn-sm" [class]="u.isBlocked ? 'btn-teal' : 'btn-danger'" (click)="toggleBlock(u)">
                    {{ u.isBlocked ? 'Unblock' : 'Block' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #emptyUsers><p class="text-muted">No students registered yet.</p></ng-template>
      </div>

      <!-- CHAT MONITOR -->
      <div class="mt-24 monitor-grid" *ngIf="tab() === 'chat'">
        <div class="card monitor-side">
          <h4>Rooms</h4>
          <div class="monitor-item-row" *ngFor="let r of rooms()" [class.active]="selectedRoom() === r._id">
            <button class="monitor-item-btn" (click)="loadRoomMonitor(r)">
              💬 {{ r.name }}
            </button>
            <button class="delete-room-btn" (click)="deleteRoom(r, $event)" title="Delete room">✕</button>
          </div>
          <h4 class="mt-16">Anonymous DMs</h4>
          <button class="monitor-item" *ngFor="let c of conversations()" [class.active]="selectedConvo() === c._id" (click)="loadConvoMonitor(c)">
            🕶️ {{ c.participants[0]?.name }} ↔ {{ c.participants[1]?.name }}
          </button>
        </div>

        <div class="card monitor-main">
          <div *ngIf="!selectedRoom() && !selectedConvo()" class="empty-state">
            <svg class="empty-state-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <p>Select a room or DM to monitor. Real names are shown even though students see aliases.</p>
          </div>
          <div class="monitor-msg" *ngFor="let m of monitorMessages()">
            <div class="monitor-msg-head">
              <span class="real-name">{{ m.senderId?.name }}</span>
              <span class="mono text-faint text-sm">{{ m.senderId?.collegeId }}</span>
              <span class="badge badge-muted">{{ m.senderAlias }}</span>
              <span class="text-faint text-sm">{{ m.createdAt | date:'short' }}</span>
            </div>
            <div class="monitor-msg-text" [class.hidden-msg]="m.hidden">{{ m.text }}</div>
            <div class="monitor-msg-actions">
              <span class="badge badge-coral" *ngIf="m.hidden">Hidden ({{ m.reportCount }} reports)</span>
              <button class="btn btn-sm btn-outline" (click)="toggleHide(m)">{{ m.hidden ? 'Unhide' : 'Hide message' }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- REPORTS -->
      <div class="mt-24" *ngIf="tab() === 'reports'">
        <div class="table-container" *ngIf="reports().length; else emptyReports">
          <table class="admin-table">
            <thead><tr><th>Reported user</th><th>Message</th><th>Reported by</th><th>Reason</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let r of reports()">
                <td>{{ r.reportedUser?.name }} <span class="text-faint text-sm mono">({{ r.reportedUser?.collegeId }})</span></td>
                <td class="msg-cell">{{ r.messageId?.text }}</td>
                <td>{{ r.reportedBy?.name }}</td>
                <td>{{ r.reason }}</td>
                <td><span class="badge" [class]="r.status === 'open' ? 'badge-coral' : 'badge-teal'">{{ r.status }}</span></td>
                <td>
                  <button class="btn btn-sm btn-teal" *ngIf="r.status !== 'reviewed'" (click)="updateReport(r, 'reviewed')">Mark reviewed</button>
                  <button class="btn btn-sm btn-ghost" *ngIf="r.status !== 'dismissed'" (click)="updateReport(r, 'dismissed')">Dismiss</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #emptyReports><p class="text-muted">No reports filed. All clear!</p></ng-template>
      </div>

      <!-- BLOCKLIST -->
      <div class="mt-24" *ngIf="tab() === 'blocklist'">
        <div class="card">
          <h3>Blocked words</h3>
          <p class="text-muted text-sm">Messages containing these words are rejected before they're ever sent — checked server-side, so students can't bypass it from the frontend.</p>
          <form class="add-word-form" (ngSubmit)="addWord()">
            <input class="input" [(ngModel)]="newWord" name="newWord" placeholder="Add a word to block…" />
            <button class="btn btn-primary" type="submit" [disabled]="!newWord.trim()">Add</button>
          </form>
          <div class="word-list mt-16">
            <span class="tag word-tag" *ngFor="let w of blockedWords()">
              {{ w.word }}
              <button class="remove-x" (click)="removeWord(w)">✕</button>
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tabs { display: flex; gap: 6px; border-bottom: 1px solid var(--border); overflow-x: auto; }
    .tab {
      background: none; border: none; padding: 12px 18px; font-weight: 600; font-size: 14px;
      color: var(--text-muted); cursor: pointer; border-bottom: 3px solid transparent; white-space: nowrap;
    }
    .tab.active { color: var(--violet-deep); border-bottom-color: var(--violet); }

    .stat-num { font-family: var(--font-display); font-size: 30px; font-weight: 800; color: var(--ink); }

    .table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
    .admin-table { width: 100%; border-collapse: collapse; background: var(--surface); border-radius: var(--radius-md); overflow: hidden; }
    .admin-table th, .admin-table td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 13.5px; }
    .admin-table th { background: var(--surface-alt); font-family: var(--font-mono); text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; color: var(--text-muted); }
    .mono { font-family: var(--font-mono); }
    .msg-cell { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .monitor-grid { display: grid; grid-template-columns: 280px 1fr; gap: 20px; }
    .monitor-side h4 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 0 0 8px; }
    .monitor-item-row {
      display: flex; align-items: center; justify-content: space-between;
      border-radius: var(--radius-sm); margin-bottom: 2px;
    }
    .monitor-item-row:hover { background: var(--surface-alt); }
    .monitor-item-row.active { background: var(--violet-light); color: var(--violet-deep); font-weight: 600; }
    .monitor-item-btn {
      flex: 1; text-align: left; background: none; border: none; padding: 9px 10px;
      font-size: 13.5px; cursor: pointer; color: inherit; font-weight: inherit;
    }
    .delete-room-btn {
      background: none; border: none; padding: 9px 12px; cursor: pointer;
      color: var(--text-muted); font-size: 13.5px; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center;
    }
    .delete-room-btn:hover {
      color: var(--coral-deep); background: #fff0ee;
    }
    .monitor-main { min-height: 400px; }
    .monitor-msg { padding: 12px 0; border-bottom: 1px dashed var(--border); }
    .monitor-msg-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
    .real-name { font-weight: 700; color: var(--ink); font-size: 13.5px; }
    .monitor-msg-text { font-size: 14px; }
    .monitor-msg-text.hidden-msg { text-decoration: line-through; color: var(--text-faint); }
    .monitor-msg-actions { margin-top: 6px; display: flex; align-items: center; gap: 8px; }

    .add-word-form { display: flex; gap: 10px; max-width: 420px; }
    .word-list { display: flex; flex-wrap: wrap; }
    .word-tag { display: inline-flex; align-items: center; gap: 6px; background: #fff0ee; color: var(--coral-deep); }
    .remove-x { background: none; border: none; cursor: pointer; color: var(--coral-deep); font-size: 11px; }

    @media (max-width: 800px) { .monitor-grid { grid-template-columns: 1fr; } }
  `],
})
export class AdminDashboardComponent implements OnInit {
  tab = signal<Tab>('overview');
  stats = signal<any>(null);
  users = signal<any[]>([]);
  rooms = signal<any[]>([]);
  conversations = signal<any[]>([]);
  selectedRoom = signal<string | null>(null);
  selectedConvo = signal<string | null>(null);
  monitorMessages = signal<any[]>([]);
  reports = signal<any[]>([]);
  blockedWords = signal<any[]>([]);
  newWord = '';

  constructor(private admin: AdminService, private chatService: ChatService, private toast: ToastService) {}

  ngOnInit() {
    this.admin.stats().subscribe((s) => this.stats.set(s));
  }

  setTab(t: Tab) {
    this.tab.set(t);
    if (t === 'users' && !this.users().length) this.admin.users().subscribe((d) => this.users.set(d));
    if (t === 'chat' && !this.rooms().length) {
      this.chatService.listRooms().subscribe((d) => this.rooms.set(d));
      this.admin.conversations().subscribe((d) => this.conversations.set(d));
    }
    if (t === 'reports') this.admin.reports().subscribe((d) => this.reports.set(d));
    if (t === 'blocklist' && !this.blockedWords().length) this.admin.blockedWords().subscribe((d) => this.blockedWords.set(d));
  }

  toggleBlock(u: any) {
    this.admin.setBlocked(u._id, !u.isBlocked, 'Violation of community guidelines').subscribe((updated) => {
      u.isBlocked = updated.isBlocked;
      this.toast.success(u.isBlocked ? `${u.name} has been blocked` : `${u.name} has been unblocked`);
    });
  }

  deleteRoom(r: any, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete the room "${r.name}" and all of its messages? This action cannot be undone.`)) {
      this.admin.removeRoom(r._id).subscribe(() => {
        this.rooms.update((list) => list.filter((x) => x._id !== r._id));
        this.toast.success(`Room "${r.name}" has been deleted.`);
        if (this.selectedRoom() === r._id) {
          this.selectedRoom.set(null);
          this.monitorMessages.set([]);
        }
      });
    }
  }

  loadRoomMonitor(r: any) {
    this.selectedRoom.set(r._id);
    this.selectedConvo.set(null);
    this.admin.roomMessages(r._id).subscribe((d) => this.monitorMessages.set(d));
  }

  loadConvoMonitor(c: any) {
    this.selectedConvo.set(c._id);
    this.selectedRoom.set(null);
    this.admin.conversationMessages(c._id).subscribe((d) => this.monitorMessages.set(d));
  }

  toggleHide(m: any) {
    this.admin.setMessageHidden(m._id, !m.hidden).subscribe((updated) => {
      m.hidden = updated.hidden;
      m.reportCount = updated.reportCount;
    });
  }

  updateReport(r: any, status: string) {
    this.admin.updateReport(r._id, status).subscribe((updated) => { r.status = updated.status; });
  }

  addWord() {
    const word = this.newWord.trim();
    if (!word) return;
    this.admin.addBlockedWord(word).subscribe((created) => {
      this.blockedWords.update((list) => [...list, created]);
      this.newWord = '';
      this.toast.success(`"${word}" added to blocklist`);
    });
  }

  removeWord(w: any) {
    this.admin.removeBlockedWord(w._id).subscribe(() => {
      this.blockedWords.set(this.blockedWords().filter((x) => x._id !== w._id));
    });
  }
}
