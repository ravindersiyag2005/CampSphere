import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { StaggerInDirective } from '../../shared/components/stagger-in.directive';

@Component({
  selector: 'app-chat-dms-list',
  standalone: true,
  imports: [CommonModule, RouterLink, StaggerInDirective],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <div class="eyebrow">🕶️ Private Chats</div>
          <h1>Your anonymous DMs</h1>
          <p class="text-muted">
            One-on-one anonymous conversations. You can start a new DM from inside a group room.
          </p>
        </div>
      </div>

      <div class="dm-list mt-24" appStaggerIn *ngIf="conversations().length; else noDms">
        <a class="card card-hover dm-row" *ngFor="let c of conversations()" [routerLink]="['/chat/dm', c._id]">
          <div class="avatar avatar-sm" style="background: var(--pink)">{{ c.otherAlias?.[0] || 'A' }}</div>
          <div class="dm-info">
            <div class="dm-name">
              {{ c.otherAlias }}
              <span class="unread-dot" *ngIf="c.hasUnread"></span>
            </div>
            <div class="text-sm text-faint">Last active {{ c.lastMessageAt | date:'short' }}</div>
          </div>
          <span class="dm-arrow">→</span>
        </a>
      </div>
      <ng-template #noDms>
        <p class="text-muted text-sm mt-8" *ngIf="!loading()">
          No private chats yet. Start one from inside a group room by clicking "Message privately" on someone's message.
        </p>
        <div class="skeleton mt-8" style="height: 60px" *ngIf="loading()"></div>
      </ng-template>
    </div>
  `,
  styles: [`
    .dm-list { display: flex; flex-direction: column; gap: 10px; max-width: 600px; }
    .dm-row { display: flex; align-items: center; gap: 12px; text-decoration: none; padding: 14px 18px; }
    .dm-info { flex: 1; }
    .dm-name { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--ink); }
    .dm-arrow { color: var(--text-faint); }
    .unread-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: var(--coral);
      border-radius: 50%;
      box-shadow: 0 0 6px var(--coral);
    }
  `],
})
export class ChatDmsListComponent implements OnInit {
  conversations = signal<any[]>([]);
  loading = signal(true);

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.loading.set(true);
    this.chatService.listConversations().subscribe({
      next: (data) => {
        this.conversations.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
