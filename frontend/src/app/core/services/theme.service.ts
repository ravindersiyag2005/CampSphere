import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';
const STORAGE_KEY = 'campsphere_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.readInitial());

  constructor() {
    effect(() => {
      const mode = this.mode();
      document.documentElement.setAttribute('data-theme', mode);
      localStorage.setItem(STORAGE_KEY, mode);
    });
  }

  private readInitial(): ThemeMode {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  toggle() {
    this.mode.set(this.mode() === 'dark' ? 'light' : 'dark');
  }

  set(mode: ThemeMode) {
    this.mode.set(mode);
  }
}
