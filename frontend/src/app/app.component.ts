import { Component, AfterViewInit, ElementRef, ViewChild, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ToastService } from './core/services/toast.service';
import { ThemeService } from './core/services/theme.service';
import { AnimationService } from './core/services/animation.service';
import { ChatService } from './core/services/chat.service';
import { SocketService } from './core/services/socket.service';
import { PostService } from './core/services/post.service';
import { BackgroundFxComponent } from './shared/components/background-fx.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BackgroundFxComponent],
  template: `
    <app-background-fx></app-background-fx>

    <!-- Sidebar DP Preview Lightbox -->
    <div class="lightbox-overlay" *ngIf="previewOpen() && auth.currentUser()?.avatarUrl" (click)="previewOpen.set(false)">
      <div class="lightbox-content" (click)="$event.stopPropagation()">
        <button class="lightbox-close" (click)="previewOpen.set(false)">×</button>
        <div class="lightbox-img" 
             [style.background-color]="auth.currentUser()?.avatarColor" 
             [style.background-image]="'url(' + getAvatarUrl(auth.currentUser()?.avatarUrl || '') + ')'"
             [style.background-size]="'cover'"
             [style.background-position]="'top center'"
             [style.background-repeat]="'no-repeat'">
        </div>
        <p class="lightbox-caption mt-12">Full Profile Picture Preview</p>
      </div>
    </div>

    <header class="mobile-header" *ngIf="auth.isLoggedIn()">
      <button class="menu-btn" (click)="sidebarOpen.set(true)">☰</button>
      <div class="mobile-brand">
        <svg class="brand-logo" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
        <span class="brand-text">Campiq</span>
      </div>
      <div style="width: 40px;"></div>
    </header>

    <div class="sidebar-backdrop" *ngIf="auth.isLoggedIn() && sidebarOpen()" (click)="sidebarOpen.set(false)"></div>

    <div class="shell" [class.no-nav]="!auth.isLoggedIn()">
      <aside class="sidebar" *ngIf="auth.isLoggedIn()" [class.open]="sidebarOpen()" #sidebar>
        <div class="brand">
          <svg class="brand-logo" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
          <div class="brand-text-wrapper" style="display: flex; flex-direction: column;">
            <span class="brand-text">Campiq</span>
            <span style="font-size: 10px; color: var(--text-muted); font-weight: 500; letter-spacing: 0.5px;">Your Campus, Connected</span>
          </div>
        </div>

        <nav class="nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link" (click)="sidebarOpen.set(false)">
            <svg class="sidebar-icon" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Dashboard
          </a>
          <a routerLink="/notes" routerLinkActive="active" class="nav-link" (click)="sidebarOpen.set(false)">
            <svg class="sidebar-icon" viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
            Notes
          </a>
          <a routerLink="/pyq" routerLinkActive="active" class="nav-link" (click)="sidebarOpen.set(false)">
            <svg class="sidebar-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            PYQ Bank
          </a>
          <a routerLink="/events" routerLinkActive="active" class="nav-link" (click)="sidebarOpen.set(false)">
            <svg class="sidebar-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 14h.01M16 14h.01M8 14h.01M12 18h.01M16 18h.01M8 18h.01"/></svg>
            Events
          </a>
          <a routerLink="/travel" routerLinkActive="active" class="nav-link" (click)="sidebarOpen.set(false)">
            <svg class="sidebar-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            Travel Buddy
          </a>
          <a routerLink="/food" routerLinkActive="active" class="nav-link" (click)="sidebarOpen.set(false)">
            <svg class="sidebar-icon" viewBox="0 0 24 24"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
            Food Spots
          </a>
          <a routerLink="/chat" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" [class.active]="router.url.startsWith('/chat/room')" class="nav-link" (click)="sidebarOpen.set(false)">
            <svg class="sidebar-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Anonymous Chat
          </a>
          <a routerLink="/chat/dms" routerLinkActive="active" [class.active]="router.url.startsWith('/chat/dm/')" class="nav-link" (click)="sidebarOpen.set(false)">
            <svg class="sidebar-icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Private Chats
            <span class="unread-dot" *ngIf="hasUnreadDMs()"></span>
          </a>
          <a routerLink="/photoholic" routerLinkActive="active" class="nav-link" (click)="sidebarOpen.set(false)">
            <svg class="sidebar-icon" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            Photoholic
            <span class="unread-dot" *ngIf="hasUnreadPhotoholic()"></span>
          </a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-link" (click)="sidebarOpen.set(false)">
            <svg class="sidebar-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </a>
          <a *ngIf="auth.isAdmin()" routerLink="/admin" routerLinkActive="active" class="nav-link nav-link-admin" (click)="sidebarOpen.set(false)">
            <svg class="sidebar-icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Admin Panel
          </a>
        </nav>

        <button class="theme-toggle" (click)="toggleTheme($event)" [title]="theme.mode() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
          <span class="theme-toggle-track" [class.is-dark]="theme.mode() === 'dark'">
            <span class="theme-toggle-thumb">{{ theme.mode() === 'dark' ? '🌙' : '☀️' }}</span>
          </span>
          <span class="theme-toggle-label">{{ theme.mode() === 'dark' ? 'Dark mode' : 'Light mode' }}</span>
        </button>

        <div class="sidebar-footer" *ngIf="auth.currentUser() as u">
          <div class="avatar avatar-sm" [style.background-color]="u.avatarColor" [style.background-image]="u.avatarUrl ? 'url(' + getAvatarUrl(u.avatarUrl) + ')' : ''" [style.background-size]="'cover'" [style.background-position]="'top center'" [style.background-repeat]="'no-repeat'" (click)="u.avatarUrl ? previewOpen.set(true) : null" [style.cursor]="u.avatarUrl ? 'pointer' : 'default'" [title]="u.avatarUrl ? 'Click to preview' : ''">
            <span *ngIf="!u.avatarUrl">{{ initials(u.name) }}</span>
          </div>
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
    .brand-logo {
      width: 24px;
      height: 24px;
      stroke: var(--violet);
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: rgba(0, 242, 254, 0.15);
      filter: drop-shadow(0 0 8px rgba(0, 242, 254, 0.6));
      flex-shrink: 0;
    }
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
    .sidebar-icon {
      width: 18px;
      height: 18px;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      transition: stroke 0.15s ease, filter 0.15s ease;
      flex-shrink: 0;
    }
    .nav-link:hover { background: rgba(0,242,254,0.07); color: var(--violet); border-color: rgba(0,242,254,0.15); }
    .nav-link:hover .sidebar-icon {
      stroke: var(--violet);
      filter: drop-shadow(0 0 4px rgba(0, 242, 254, 0.6));
    }
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

    .mobile-header { display: none; }
    .sidebar-backdrop { display: none; }
    .content { flex: 1; min-width: 0; }

    @media (max-width: 880px) {
      .mobile-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 60px;
        padding: 0 16px;
        background: linear-gradient(180deg, #04050a 0%, #080b12 100%);
        border-bottom: 1px solid rgba(0, 242, 254, 0.12);
        position: sticky;
        top: 0;
        z-index: 999;
        color: #fff;
      }
      .mobile-brand {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .menu-btn {
        background: none;
        border: none;
        color: #fff;
        font-size: 24px;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .sidebar-backdrop {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 1000;
      }

      .shell {
        flex-direction: column;
        min-height: calc(100vh - 60px);
      }
      
      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: 280px;
        height: 100vh;
        z-index: 1001;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.6);
      }
      
      .sidebar.open {
        transform: translateX(0);
      }

      .sidebar-footer {
        display: flex;
        margin-top: auto;
      }
    }

    /* Lightbox modal styles */
    .lightbox-overlay {
      position: fixed;
      inset: 0;
      background: rgba(4, 5, 10, 0.94);
      backdrop-filter: blur(16px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      animation: fadeIn 0.2s ease;
    }
    .lightbox-content {
      position: relative;
      max-width: 500px;
      width: 100%;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .lightbox-close {
      position: absolute;
      top: -48px;
      right: 0;
      background: none;
      border: none;
      color: #fff;
      font-size: 36px;
      cursor: pointer;
      line-height: 1;
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    .lightbox-close:hover { opacity: 1; }
    .lightbox-img {
      width: 280px;
      height: 280px;
      border-radius: 50%;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
      border: 3px solid rgba(255,255,255,0.15);
      display: block;
    }
    .lightbox-caption {
      font-family: var(--font-mono);
      font-size: 13.5px;
      color: var(--violet);
      text-shadow: 0 0 8px rgba(0, 242, 254, 0.5);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('sidebar') sidebarRef?: ElementRef<HTMLElement>;
  hasUnreadDMs = signal(false);
  hasUnreadPhotoholic = signal(false);
  sidebarOpen = signal(false);
  previewOpen = signal(false);

  constructor(
    public auth: AuthService,
    public toast: ToastService,
    public theme: ThemeService,
    private anim: AnimationService,
    public router: Router,
    private chat: ChatService,
    private postService: PostService,
    private socketService: SocketService
  ) {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.chat.checkUnreadDMs().subscribe(res => this.hasUnreadDMs.set(res.hasUnread));
        this.postService.checkUnread().subscribe(res => this.hasUnreadPhotoholic.set(res.hasUnread));
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
        if (event.urlAfterRedirects.includes('/photoholic') && this.auth.isLoggedIn()) {
          this.hasUnreadPhotoholic.set(false); // clear dot instantly on visit
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

  getAvatarUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = environment.apiUrl.replace('/api', '');
    return `${apiBase}${path}`;
  }

  initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
