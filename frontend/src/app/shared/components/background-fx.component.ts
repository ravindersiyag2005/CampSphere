import { Component, ElementRef, AfterViewInit, OnDestroy, ViewChild, ViewChildren, QueryList, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import anime from 'animejs';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-background-fx',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-fx" aria-hidden="true">
      <div class="bg-photo bg-photo-light"></div>
      <div class="bg-photo bg-photo-dark"></div>
      <div class="bg-tint"></div>
      <div class="blob b1" #blob></div>
      <div class="blob b2" #blob></div>
      <div class="blob b3" #blob></div>
      <div class="blob b4" #blob></div>
      <div class="grain"></div>
    </div>
  `,
  styles: [`
    .bg-fx {
      position: fixed;
      inset: 0;
      z-index: -1;
      overflow: hidden;
      pointer-events: none;
    }

    .bg-photo {
      position: absolute;
      inset: -2%;
      background-size: cover;
      background-position: center;
      transition: opacity 0.6s ease;
      filter: saturate(0.9);
    }
    .bg-photo-light {
      background-image: url('https://images.unsplash.com/photo-1747502064507-ed08d79802db?auto=format&fit=crop&w=1800&q=60');
      opacity: 0.16;
    }
    .bg-photo-dark {
      background-image: url('https://images.unsplash.com/photo-1754444540401-d3ec14c5efda?auto=format&fit=crop&w=1800&q=60');
      opacity: 0;
    }
    :host-context([data-theme='dark']) .bg-photo-light { opacity: 0; }
    :host-context([data-theme='dark']) .bg-photo-dark { opacity: 0.24; }

    .bg-tint {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, var(--bg) 0%, transparent 30%, transparent 70%, var(--bg) 100%);
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(70px);
      opacity: 0.35;
      will-change: transform;
    }
    .b1 { width: 420px; height: 420px; background: var(--violet); top: -10%; left: -8%; }
    .b2 { width: 360px; height: 360px; background: var(--coral); top: 55%; right: -6%; }
    .b3 { width: 300px; height: 300px; background: var(--teal); bottom: -8%; left: 20%; }
    .b4 { width: 260px; height: 260px; background: var(--amber); top: 10%; right: 25%; opacity: 0.22; }

    .grain {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle, rgba(120,110,200,0.05) 1px, transparent 1px);
      background-size: 22px 22px;
      opacity: 0.5;
    }
  `],
})
export class BackgroundFxComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('blob') blobRefs!: QueryList<ElementRef<HTMLElement>>;
  private theme = inject(ThemeService);
  private animations: anime.AnimeInstance[] = [];
  private mouseHandler = (e: MouseEvent) => this.onMouseMove(e);

  ngAfterViewInit() {
    const blobs = this.blobRefs.toArray().map((r) => r.nativeElement);
    blobs.forEach((blob, i) => {
      const dur = 9000 + i * 2500;
      const dx = 40 + i * 10;
      const dy = 30 + i * 12;
      const anim = anime({
        targets: blob,
        translateX: [0, dx, -dx * 0.6, 0],
        translateY: [0, -dy, dy * 0.5, 0],
        scale: [1, 1.08, 0.95, 1],
        easing: 'easeInOutSine',
        duration: dur,
        loop: true,
      });
      this.animations.push(anim);
    });

    window.addEventListener('mousemove', this.mouseHandler, { passive: true });
  }

  private onMouseMove(e: MouseEvent) {
    const blobs = this.blobRefs?.toArray().map((r) => r.nativeElement) ?? [];
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    blobs.forEach((blob, i) => {
      const strength = 8 + i * 4;
      blob.style.setProperty('--px', `${nx * strength}px`);
      blob.style.setProperty('--py', `${ny * strength}px`);
      blob.style.translate = `var(--px, 0) var(--py, 0)`;
    });
  }

  ngOnDestroy() {
    window.removeEventListener('mousemove', this.mouseHandler);
    this.animations.forEach((a) => a.pause());
  }
}
