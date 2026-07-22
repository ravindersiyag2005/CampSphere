import { Component, signal, AfterViewInit, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import anime from 'animejs';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AnimationService } from '../../core/services/animation.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="auth-visual">
        <div class="visual-photo"></div>
        <div class="blob blob-1" #blob></div>
        <div class="blob blob-2" #blob></div>
        <div class="blob blob-3" #blob></div>
        <div class="auth-visual-inner">
          <svg class="visual-logo" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
          <h1>Join Campsphere</h1>
          <p class="tagline" style="font-weight: 600; font-size: 1.1rem; color: var(--violet); margin-top: -8px; margin-bottom: 12px;">Your Campus, Connected</p>
          <p>Sign up with your college ID to share notes, find a travel buddy, or just vent anonymously with your batch.</p>
        </div>
      </div>

      <div class="auth-form-side">
        <div class="auth-card card" #card>
          <div class="eyebrow">Create account</div>
          <h2>Set up your profile</h2>

          <div class="form-error" *ngIf="error()">{{ error() }}</div>

          <form (ngSubmit)="submit()" #f="ngForm">
            <div class="field">
              <label for="name">Full name</label>
              <input class="input" id="name" name="name" type="text" [(ngModel)]="name" required placeholder="Ananya Sharma" />
            </div>
            <div class="field">
              <label for="collegeId">College ID</label>
              <input class="input" id="collegeId" name="collegeId" type="text" [(ngModel)]="collegeId" required placeholder="21BCS1042" />
            </div>
            <div class="field">
              <label for="password">Password</label>
              <input class="input" id="password" name="password" type="password" [(ngModel)]="password" required minlength="6" placeholder="At least 6 characters" />
            </div>
            <div class="field" *ngIf="showAdminCode">
              <label for="adminCode">Admin Secret Code</label>
              <input class="input" id="adminCode" name="adminCode" type="password" [(ngModel)]="adminCode" placeholder="Enter secret code to get admin rights" />
            </div>
            
            <button class="btn btn-primary btn-block" type="submit" [disabled]="loading() || f.invalid">
              <span class="spinner" *ngIf="loading()"></span>
              {{ loading() ? 'Creating account…' : 'Create account' }}
            </button>
          </form>

          <p class="text-center text-muted mt-16 text-sm" style="cursor: pointer" (click)="showAdminCode = !showAdminCode">
            Are you a campus administrator?
          </p>

          <p class="text-center text-muted mt-16 text-sm">
            Already have an account? <a routerLink="/login">Log in</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrap { display: flex; min-height: 100vh; }
    .auth-visual {
      flex: 1.1;
      position: relative;
      background: linear-gradient(160deg, var(--shell) 0%, var(--coral-deep) 100%);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .visual-photo {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(160deg, rgba(20,19,43,0.82) 0%, rgba(229,80,63,0.68) 100%),
        url('https://images.unsplash.com/photo-1754444540401-d3ec14c5efda?auto=format&fit=crop&w=1400&q=60');
      background-size: cover;
      background-position: center;
    }
    .blob { position: absolute; border-radius: 50%; filter: blur(50px); opacity: 0.55; will-change: transform; }
    .blob-1 { width: 340px; height: 340px; background: var(--violet); top: -60px; right: -60px; }
    .blob-2 { width: 300px; height: 300px; background: var(--teal); bottom: -80px; left: -40px; }
    .blob-3 { width: 220px; height: 220px; background: var(--amber); top: 30%; right: 15%; opacity: 0.35; }
    .auth-visual-inner { position: relative; z-index: 1; max-width: 420px; padding: 40px; color: #fff; text-align: center; display: flex; flex-direction: column; align-items: center; }
    .visual-logo {
      width: 54px;
      height: 54px;
      stroke: #fff;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: rgba(255, 255, 255, 0.1);
      margin-bottom: 12px;
      filter: drop-shadow(0 0 10px rgba(0, 242, 254, 0.5));
    }
    .auth-visual-inner h1 { font-family: var(--font-display); font-size: 34px; color: #fff; margin-bottom: 14px; }
    .auth-visual-inner p { color: rgba(255,255,255,0.82); font-size: 15.5px; }

    .auth-form-side { flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px; background: var(--bg); }
    .auth-card { width: 100%; max-width: 420px; }
    .auth-card h2 { font-size: 24px; margin-bottom: 20px; }

    @media (max-width: 880px) { .auth-visual { display: none; } }
  `],
})
export class RegisterComponent implements AfterViewInit {
  @ViewChild('card') cardRef?: ElementRef<HTMLElement>;
  @ViewChildren('blob') blobRefs!: QueryList<ElementRef<HTMLElement>>;

  name = '';
  collegeId = '';
  password = '';
  adminCode = '';
  showAdminCode = false;
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router, private toast: ToastService, private anim: AnimationService) {}

  ngAfterViewInit() {
    if (this.cardRef) this.anim.fadeUp(this.cardRef.nativeElement);
    this.blobRefs.forEach((ref, i) => {
      anime({
        targets: ref.nativeElement,
        translateX: [0, -28 - i * 10, 22, 0],
        translateY: [0, 22, -24, 0],
        scale: [1, 0.92, 1.08, 1],
        easing: 'easeInOutSine',
        duration: 8600 + i * 2000,
        loop: true,
      });
    });
  }

  submit() {
    this.error.set('');
    this.loading.set(true);
    const payload: any = { name: this.name, collegeId: this.collegeId, password: this.password };
    if (this.adminCode) {
      payload.adminCode = this.adminCode;
    }
    
    this.auth.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Account created! Welcome to Campsphere.');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Registration failed. Please try again.');
        if (this.cardRef) this.anim.shake(this.cardRef.nativeElement);
      },
    });
  }
}
