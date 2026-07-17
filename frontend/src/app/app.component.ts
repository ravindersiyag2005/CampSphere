import { Component, AfterViewInit, ElementRef, ViewChild, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ToastService } from './core/services/toast.service';
import { ThemeService } from './core/services/theme.service';
import { AnimationService } from './core/services/animation.service';
import { ChatService } from './core/services/chat.service';
import { SocketService } from './core/services/socket.service';
import { BackgroundFxComponent } from './shared/components/background-fx.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BackgroundFxComponent],
  template: `
    <app-background-fx></app-background-fx>

    <div class="shell" [class.no-nav]="!auth.isLoggedIn()">
      <aside class="sidebar" *ngIf="auth.isLoggedIn()" #sidebar>
        <div class="brand">
          <span class="brand-mark">🎓</span>
          <span class="brand-text">Campus<b>Hub</b></span>
        </div>

        <nav class="nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <span class="ico">🏠</span> Dashboard
          </a>
          <a routerLink="/notes" routerLinkActive="active" class="nav-link">
            <span class="ico">📚</span> Notes
          </a>
          <a routerLink="/pyq" routerLinkActive="active" class="nav-link">
            <span class="ico">📝</span> PYQ Bank
          </a>
          <a routerLink="/events" routerLinkActive="active" class="nav-link">
            <span class="ico">🎉</span> Events
          </a>
          <a routerLink="/travel" routerLinkActive="active" class="nav-link">
            <span class="ico">🧳</span> Travel Buddy
          </a>
          <a routerLink="/food" routerLinkActive="active" class="nav-link">
            <span class="ico">🍜</span> Food Spots
          </a>
          <a routerLink="/chat" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" [class.active]="router.url.startsWith('/chat/room')" class="nav-link">
            <span class="ico">💬</span> Anonymous Chat
          </a>
          <a routerLink="/chat/dms" routerLinkActive="active" [class.active]="router.url.startsWith('/chat/dm/')" class="nav-link">
            <span class="ico">🕶️</span> Private Chats
            <span class="unread-dot" *ngIf="hasUnreadDMs()"></span>
          </a>
          <a *ngIf="auth.isAdmin()" routerLink="/admin" routerLinkActive="active" class="nav-link nav-link-admin">
            <span class="ico">🛡️</span> Admin Panel
          </a>
        </nav>

        <button class="theme-toggle" (click)="toggleTheme($event)" [title]="theme.mode() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
          <span class="theme-toggle-track" [class.is-dark]="theme.mode() === 'dark'">
            <span class="theme-toggle-thumb">{{ theme.mode() === 'dark' ? '🌙' : '☀️' }}</span>
          </span>
          <span class="theme-toggle-label">{{ theme.mode() === 'dark' ? 'Dark mode' : 'Light mode' }}</span>
        </button>

        <div class="sidebar-footer" *ngIf="auth.currentUser() as u">
          <div class="avatar avatar-sm" [style.background]="u.avatarColor">{{ initials(u.name) }}</div>
          <div class="who">
            <div class="who-name">{{ u.name }}</div>
            <div class="who-id">{{ u.collegeId }}</div>
          </div>
          <button class="btn-icon-plain" (click)="auth.logout()" title="Log out">⏻</button>
        </div>
      </aside>

      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>

    <div class="toast-stack">
      <div class="toast" *ngFor="let t of toast.toasts()" [class]="t.type">
        {{ t.text }}
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
    }
    .shell.no-nav { display: block; }

    .sidebar {
      width: 250px;
      flex-shrink: 0;
      background: linear-gradient(180deg, #04050a 0%, #080b12 100%);
      border-right: 1px solid rgba(0, 242, 254, 0.12);
      color: #fff;
      display: flex;
      flex-direction: column;
      padding: 22px 16px;
      position: sticky;
      top: 0;
      height: 100vh;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px 26px;
    }
    .brand-mark { font-size: 26px; }
    .brand-text {
      font-family: var(--font-mono);
      font-size: 17px;
      font-weight: 700;
      color: #e2e8f0;
      letter-spacing: 0.04em;
    }
    .brand-text b { color: var(--violet); font-weight: 800; text-shadow: 0 0 10px rgba(0,242,254,0.8); }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      border-radius: var(--radius-md);
      color: rgba(200, 220, 255, 0.65);
      font-size: 14px;
      font-weight: 500;
      transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
      border: 1px solid transparent;
    }
    .nav-link .ico { font-size: 17px; width: 20px; text-align: center; }
    .nav-link:hover { background: rgba(0,242,254,0.07); color: var(--violet); border-color: rgba(0,242,254,0.15); }
    .nav-link.active {
      background: rgba(0, 242, 254, 0.1);
      border-color: rgba(0, 242, 254, 0.3);
      color: var(--violet);
      box-shadow: 0 0 12px rgba(0,242,254,0.2) inset;
      text-shadow: 0 0 6px rgba(0,242,254,0.4);
    }
    .nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .nav-link-admin.active {
      background: rgba(243, 85, 136, 0.12);
      border-color: rgba(243, 85, 136, 0.3);
      color: var(--coral);
      box-shadow: 0 0 12px rgba(243,85,136,0.2) inset;
    }
    .unread-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: var(--coral);
      border-radius: 50%;
      margin-left: auto;
      box-shadow: 0 0 8px var(--coral), 0 0 14px rgba(243,85,136,0.5);
      animation: pulse-dot 1.5s ease-in-out infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.3); }
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 10px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px 10px;
      border-radius: var(--radius-md);
      color: rgba(200, 220, 255, 0.7);
      font-size: 13px;
      font-weight: 500;
      width: 100%;
    }
    .theme-toggle:hover { background: rgba(0,242,254,0.07); color: var(--violet); }
    .theme-toggle-track {
      width: 42px;
      height: 24px;
      border-radius: 999px;
      background: rgba(255,255,255,0.14);
      position: relative;
      flex-shrink: 0;
      transition: background 0.2s ease;
    }
    .theme-toggle-track.is-dark { background: linear-gradient(135deg, var(--violet), var(--violet-deep)); }
    .theme-toggle-thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      transition: transform 0.25s cubic-bezier(.4,0,.2,1);
      transform: translateX(0);
    }
    .theme-toggle-track.is-dark .theme-toggle-thumb { transform: translateX(18px); }

    .sidebar-footer {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 10px 4px;
      border-top: 1px solid rgba(255,255,255,0.08);
      margin-top: 10px;
    }
    .who { flex: 1; min-width: 0; }
    .who-name { font-size: 13.5px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .who-id { font-size: 11.5px; font-family: var(--font-mono); color: rgba(255,255,255,0.5); }
    .btn-icon-plain {
      background: rgba(255,255,255,0.08);
      border: none;
      color: #fff;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 14px;
    }
    .btn-icon-plain:hover { background: rgba(255,255,255,0.18); }

    .content { flex: 1; min-width: 0; }

    @media (max-width: 880px) {
      .shell { flex-direction: column; }
      .sidebar {
        width: 100%;
        height: auto;
        position: relative;
        flex-direction: row;
        align-items: center;
        overflow-x: auto;
        padding: 12px;
      }
      .brand { padding: 0 12px 0 0; }
      .nav { flex-direction: row; }
      .nav-link span.ico { font-size: 16px; }
      .nav-link { padding: 8px 12px; white-space: nowrap; }
      .sidebar-footer { display: none; }
    }
  `],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('sidebar') sidebarRef?: ElementRef<HTMLElement>;
  hasUnreadDMs = signal(false);

  constructor(
    public auth: AuthService,
    public toast: ToastService,
    public theme: ThemeService,
    private anim: AnimationService,
    public router: Router,
    private chat: ChatService,
    private socketService: SocketService
  ) {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.chat.checkUnreadDMs().subscribe(res => this.hasUnreadDMs.set(res.hasUnread));
        this.socketService.instance.on('dmNotification', () => {
          this.hasUnreadDMs.set(true);
        });
      }
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (event.urlAfterRedirects.includes('/chat/dm') && this.auth.isLoggedIn()) {
          this.chat.checkUnreadDMs().subscribe(res => this.hasUnreadDMs.set(res.hasUnread));
        }
      }
    });
  }

  ngAfterViewInit() {
    if (this.sidebarRef) {
      this.anim.staggerIn(Array.from(this.sidebarRef.nativeElement.querySelectorAll('.nav-link')), { y: 10 });
    }
  }

  toggleTheme(event: MouseEvent) {
    this.anim.pulse(event.currentTarget as Element);
    this.theme.toggle();
  }

  initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
