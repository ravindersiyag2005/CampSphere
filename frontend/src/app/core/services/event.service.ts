import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EventService {
  private base = `${environment.apiUrl}/events`;
  constructor(private http: HttpClient) {}

  list(category?: string) {
    return this.http.get<any[]>(`${this.base}${category ? '?category=' + category : ''}`);
  }
  create(payload: any) {
    return this.http.post<any>(this.base, payload);
  }
  toggleInterest(id: string) {
    return this.http.post<any>(`${this.base}/${id}/interest`, {});
  }
  remove(id: string) {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
