import { Injectable, signal } from '@angular/core';

export interface ToastMsg {
  id: number;
  text: string;
  type: 'info' | 'success' | 'error';
}

let nextId = 1;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMsg[]>([]);

  show(text: string, type: ToastMsg['type'] = 'info') {
    const toast: ToastMsg = { id: nextId++, text, type };
    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), 3800);
  }

  success(text: string) { this.show(text, 'success'); }
  error(text: string) { this.show(text, 'error'); }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
