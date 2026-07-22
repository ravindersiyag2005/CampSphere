import { Component, AfterViewInit, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AnimationService } from '../../core/services/animation.service';

interface ModuleCard {
  title: string;
  desc: string;
  icon: string;
  link: string;
  image: string;
  glow: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page page--dashboard">
      <section class="hero" #hero>
        <div class="hero-text">
          <div class="eyebrow">👋 {{ greeting() }}</div>
          <h1>Hey {{ firstName() }}, what are we sorting out today?</h1>
          <p class="text-muted">
            Share notes, hunt down last year's papers, find a ride home, discover the best canteen dish,
            or just talk anonymously with your batch — pick a module below.
          </p>
        </div>
        <div class="hero-stats" *ngIf="auth.currentUser() as u">
          <div class="stat-chip">
            <span class="stat-num" #statPts>0</span>
            <span class="stat-label">contribution pts</span>
          </div>
          <div class="stat-chip">
            <span class="stat-num" #statRep>0</span>
            <span class="stat-label">reputation</span>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-3 mt-24" #cardGrid>
        <a class="module-card" *ngFor="let m of modules" [routerLink]="m.link"
           [style.--card-glow]="m.glow" 
           [style.background-image]="'radial-gradient(circle at 85% 15%, ' + m.glow + '22 0%, transparent 60%), radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)'"
           (mouseenter)="bounceEmoji($event)">
          <span class="module-icon" [innerHTML]="m.icon"></span>
          <h3>{{ m.title }}</h3>
          <p class="text-sm">{{ m.desc }}</p>
          <span class="module-cta">Open <span class="arrow">→</span></span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .hero {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      flex-wrap: wrap;
      background:
        radial-gradient(circle at 15% 20%, rgba(0,242,254,0.35), transparent 55%),
        radial-gradient(circle at 85% 80%, rgba(255,0,127,0.30), transparent 55%),
        linear-gradient(135deg, #150e3d 0%, #241a5e 55%, #0d2a3a 100%);
      border-radius: var(--radius-lg);
      padding: 40px;
      color: #fff;
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(0,242,254,0.18);
    }
    .hero-text { position: relative; z-index: 1; max-width: 620px; }
    .hero .eyebrow { color: var(--amber); text-shadow: 0 0 8px rgba(255,184,0,0.5); }
    .hero h1 { font-family: var(--font-display-alt); color: #fff; font-size: 30px; margin-bottom: 10px; letter-spacing: -0.01em; }
    .hero p.text-muted { color: rgba(255,255,255,0.82); }

    .hero-stats { display: flex; gap: 14px; position: relative; z-index: 1; }
    .stat-chip {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: var(--radius-md);
      padding: 14px 22px;
      text-align: center;
      min-width: 116px;
    }
    .stat-num { display: block; font-family: var(--font-display-alt); font-size: 28px; font-weight: 800; color: #fff; }
    .stat-label { font-size: 11px; color: rgba(255,255,255,0.75); text-transform: uppercase; letter-spacing: 0.08em; }

    .module-card {
      position: relative;
      border-radius: var(--radius-md);
      padding: 24px;
      height: 180px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      border: 1px solid rgba(255, 255, 255, 0.05);
      background-color: #07080f;
      background-size: 100% 100%, 14px 14px;
      overflow: hidden;
      transition: transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.25s ease, border-color 0.25s ease;
      color: #f4f6fc;
      text-decoration: none;
    }
    .module-card:hover {
      transform: translateY(-5px) scale(1.01);
      border-color: var(--card-glow, var(--violet));
      box-shadow: 0 12px 34px rgba(0,0,0,0.4), 0 0 0 1px var(--card-glow, var(--violet)), 0 0 28px -4px var(--card-glow, var(--violet));
    }
    .module-icon {
      margin-bottom: 8px;
      display: inline-block;
      line-height: 1;
    }
    .module-icon ::ng-deep svg {
      width: 28px;
      height: 28px;
      stroke: var(--card-glow, var(--violet));
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
      filter: drop-shadow(0 0 5px var(--card-glow, var(--violet)));
      transition: transform 0.25s ease;
    }
    .module-card:hover .module-icon ::ng-deep svg {
      transform: translateY(-2px) scale(1.05);
    }
    .module-card h3 { font-family: var(--font-display-alt); font-size: 18px; margin-bottom: 2px; color: #fff; }
    .module-card p.text-sm { color: rgba(230,236,250,0.78); margin: 0; }
    .module-cta {
      margin-top: 12px;
      font-size: 12.5px;
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--card-glow, var(--violet));
      text-transform: uppercase;
      letter-spacing: 0.06em;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .module-cta .arrow { transition: transform 0.2s ease; }
    .module-card:hover .module-cta .arrow { transform: translateX(4px); }

    html[data-theme='light'] .module-card { border-color: rgba(0,0,0,0.06); }

    @media (max-width: 768px) {
      .hero { padding: 20px; flex-direction: column; }
      .hero h1 { font-size: 24px; }
      .hero-stats { flex-wrap: wrap; width: 100%; }
      .stat-chip { flex: 1; min-width: 100px; padding: 12px; }
      .stat-num { font-size: 24px; }
      .module-card { height: auto; min-height: 160px; }
    }
  `],
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('hero') heroRef?: ElementRef<HTMLElement>;
  @ViewChild('statPts') statPtsRef?: ElementRef<HTMLElement>;
  @ViewChild('statRep') statRepRef?: ElementRef<HTMLElement>;
  @ViewChild('cardGrid') cardGridRef?: ElementRef<HTMLElement>;

  modules: ModuleCard[] = [
    { title: 'Notes Sharing', desc: 'Upload & discover subject-wise notes, upvoted by your batch.', icon: '<svg viewBox="0 0 24 24"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>', link: '/notes', image: '/backgrounds/notes-bg.jpg', glow: '#8b7bff' },
    { title: 'PYQ Bank', desc: 'Previous year papers, tagged by exam type and year.', icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>', link: '/pyq', image: '/backgrounds/pyq-bg.jpg', glow: '#ff9d4d' },
    { title: 'Campus Events', desc: 'Fests, workshops & seminars — auto-removed once they end.', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 14h.01M16 14h.01M8 14h.01M12 18h.01M16 18h.01M8 18h.01"/></svg>', link: '/events', image: '/backgrounds/events-bg.jpg', glow: '#ff5fc4' },
    { title: 'Travel Buddy', desc: 'Find a companion or share a cab/train seat home.', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>', link: '/travel', image: '/backgrounds/travel-bg.jpg', glow: '#3ee089' },
    { title: 'Food Spots', desc: 'Best dishes on campus and around the city, rated by students.', icon: '<svg viewBox="0 0 24 24"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>', link: '/food', image: '/backgrounds/food-bg.jpg', glow: '#ffb648' },
    { title: 'Anonymous Chat', desc: 'Group rooms & anonymous DMs — safe, moderated, judgement-free.', icon: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', link: '/chat', image: '/backgrounds/chat-bg.jpg', glow: '#22e0d6' },
    { title: 'Photoholic Feed', desc: 'Share photos of campus life, like, and comment on other posts.', icon: '<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>', link: '/photoholic', image: '/backgrounds/events-bg.jpg', glow: '#ff5b7f' },
  ];

  constructor(public auth: AuthService, private anim: AnimationService) {}

  ngAfterViewInit() {
    if (this.heroRef) this.anim.fadeUp(this.heroRef.nativeElement);
    if (this.cardGridRef) this.anim.popIn(Array.from(this.cardGridRef.nativeElement.children), 250);

    const u = this.auth.currentUser();
    if (u && this.statPtsRef) this.anim.countUp(this.statPtsRef.nativeElement, u.contributionPoints, { duration: 1200 });
    if (u && this.statRepRef) this.anim.countUp(this.statRepRef.nativeElement, u.reputationScore, { duration: 1200 });
  }

  bounceEmoji(event: MouseEvent) {
    const el = (event.currentTarget as HTMLElement).querySelector('.module-icon');
    this.anim.pulse(el);
  }

  firstName(): string {
    return this.auth.currentUser()?.name?.split(' ')[0] || 'there';
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }
}
