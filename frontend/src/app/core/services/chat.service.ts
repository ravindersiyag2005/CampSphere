import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private base = `${environment.apiUrl}/chat`;
  constructor(private http: HttpClient) {}

  listRooms() {
    return this.http.get<any[]>(`${this.base}/rooms`);
  }
  createRoom(payload: { name: string; subject: string; description: string }) {
    return this.http.post<any>(`${this.base}/rooms`, payload);
  }
  getRoom(roomId: string) {
    return this.http.get<any>(`${this.base}/rooms/${roomId}`);
  }
  getMyAlias(roomId: string) {
    return this.http.get<any>(`${this.base}/rooms/${roomId}/alias`);
  }
  getRoomMessages(roomId: string) {
    return this.http.get<any[]>(`${this.base}/rooms/${roomId}/messages`);
  }
  startDM(roomId: string, targetAlias: string) {
    return this.http.post<any>(`${this.base}/rooms/${roomId}/dm`, { targetAlias });
  }
  listConversations() {
    return this.http.get<any[]>(`${this.base}/conversations`);
  }
  checkUnreadDMs() {
    return this.http.get<{ hasUnread: boolean }>(`${this.base}/unread-dms`);
  }
  getConversationMessages(id: string) {
    return this.http.get<any[]>(`${this.base}/conversations/${id}/messages`);
  }
  reportMessage(id: string, reason: string) {
    return this.http.post<any>(`${this.base}/messages/${id}/report`, { reason });
  }
}
