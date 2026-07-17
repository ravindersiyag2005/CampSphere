import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = `${environment.apiUrl}/admin`;
  constructor(private http: HttpClient) {}

  stats() { return this.http.get<any>(`${this.base}/stats`); }
  users() { return this.http.get<any[]>(`${this.base}/users`); }
  setBlocked(id: string, blocked: boolean, reason?: string) {
    return this.http.patch<any>(`${this.base}/users/${id}/block`, { blocked, reason });
  }

  roomMessages(roomId: string) {
    return this.http.get<any[]>(`${this.base}/chat/rooms/${roomId}/messages`);
  }
  conversations() {
    return this.http.get<any[]>(`${this.base}/chat/conversations`);
  }
  conversationMessages(id: string) {
    return this.http.get<any[]>(`${this.base}/chat/conversations/${id}/messages`);
  }
  setMessageHidden(id: string, hidden: boolean) {
    return this.http.patch<any>(`${this.base}/messages/${id}/hide`, { hidden });
  }
  removeRoom(id: string) {
    return this.http.delete<any>(`${this.base}/rooms/${id}`);
  }

  reports() { return this.http.get<any[]>(`${this.base}/reports`); }
  updateReport(id: string, status: string) {
    return this.http.patch<any>(`${this.base}/reports/${id}`, { status });
  }

  blockedWords() { return this.http.get<any[]>(`${this.base}/blocked-words`); }
  addBlockedWord(word: string) { return this.http.post<any>(`${this.base}/blocked-words`, { word }); }
  removeBlockedWord(id: string) { return this.http.delete<any>(`${this.base}/blocked-words/${id}`); }
}
