import { Component, AfterViewInit, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AnimationService } from '../../core/services/animation.service';

interface ModuleCard {
  title: string;
  desc: string;
  emoji: string;
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
           [style.--card-glow]="m.glow" [style.background-image]="'linear-gradient(180deg, rgba(6,7,12,0.15) 0%, rgba(6,7,12,0.94) 88%), url(' + m.image + ')'"
           (mouseenter)="bounceEmoji($event)">
          <span class="module-emoji">{{ m.emoji }}</span>
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
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-end;
      gap: 4px;
      text-decoration: none;
      position: relative;
      min-height: 200px;
      border-radius: var(--radius-lg);
      padding: 20px;
      background-size: cover;
      background-position: center;
      border: 1px solid var(--border);
      overflow: hidden;
      transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
      color: #f4f6fc;
    }
    .module-card:hover {
      transform: translateY(-5px) scale(1.01);
      border-color: var(--card-glow, var(--violet));
      box-shadow: 0 12px 34px rgba(0,0,0,0.4), 0 0 0 1px var(--card-glow, var(--violet)), 0 0 28px -4px var(--card-glow, var(--violet));
    }
    .module-emoji { font-size: 30px; margin-bottom: 6px; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5)); }
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

    @media (max-width: 700px) {
      .hero { padding: 24px; }
      .hero h1 { font-size: 22px; }
    }
  `],
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('hero') heroRef?: ElementRef<HTMLElement>;
  @ViewChild('statPts') statPtsRef?: ElementRef<HTMLElement>;
  @ViewChild('statRep') statRepRef?: ElementRef<HTMLElement>;
  @ViewChild('cardGrid') cardGridRef?: ElementRef<HTMLElement>;

  modules: ModuleCard[] = [
    { title: 'Notes Sharing', desc: 'Upload & discover subject-wise notes, upvoted by your batch.', emoji: '📚', link: '/notes', image: '/backgrounds/notes-bg.jpg', glow: '#8b7bff' },
    { title: 'PYQ Bank', desc: 'Previous year papers, tagged by exam type and year.', emoji: '📝', link: '/pyq', image: '/backgrounds/pyq-bg.jpg', glow: '#ff9d4d' },
    { title: 'Campus Events', desc: 'Fests, workshops & seminars — auto-removed once they end.', emoji: '🎉', link: '/events', image: '/backgrounds/events-bg.jpg', glow: '#ff5fc4' },
    { title: 'Travel Buddy', desc: 'Find a companion or share a cab/train seat home.', emoji: '🧳', link: '/travel', image: '/backgrounds/travel-bg.jpg', glow: '#3ee089' },
    { title: 'Food Spots', desc: 'Best dishes on campus and around the city, rated by students.', emoji: '🍜', link: '/food', image: '/backgrounds/food-bg.jpg', glow: '#ffb648' },
    { title: 'Anonymous Chat', desc: 'Group rooms & anonymous DMs — safe, moderated, judgement-free.', emoji: '💬', link: '/chat', image: '/backgrounds/chat-bg.jpg', glow: '#22e0d6' },
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
    const el = (event.currentTarget as HTMLElement).querySelector('.module-emoji');
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
