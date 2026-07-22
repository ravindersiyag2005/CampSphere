import { Injectable, signal, computed, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppUser } from '../models/user.model';

const TOKEN_KEY = 'campsphere_token';
const USER_KEY = 'campsphere_user';

import type { SocketService } from './socket.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSig = signal<AppUser | null>(this.readStoredUser());
  readonly currentUser = this.currentUserSig.asReadonly();
  readonly isLoggedIn = computed(() => !!this.currentUserSig());
  readonly isAdmin = computed(() => this.currentUserSig()?.role === 'admin');

  constructor(private http: HttpClient, private router: Router, private injector: Injector) {}

  private readStoredUser(): AppUser | null {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  get token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  register(payload: { name: string; collegeId: string; password: string; adminCode?: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, payload).pipe(
      tap((res) => this.persistSession(res.token, res.user))
    );
  }

  login(payload: { collegeId: string; password: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap((res) => this.persistSession(res.token, res.user))
    );
  }

  private persistSession(token: string, user: AppUser) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSig.set(user);
  }

  updateLocalUser(user: AppUser) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSig.set(user);
  }

  logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.currentUserSig.set(null);
    
    import('./socket.service').then(m => {
      const socketService = this.injector.get(m.SocketService);
      socketService.disconnect();
    });
    
    this.router.navigate(['/login']);
  }

  searchUsers(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/auth/search?q=${encodeURIComponent(query)}`);
  }
}
