import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TravelService {
  private base = `${environment.apiUrl}/travel`;
  constructor(private http: HttpClient) {}

  list(params: { type?: string; toLocation?: string } = {}) {
    let query = Object.entries(params)
      .filter(([, v]) => !!v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join('&');
    return this.http.get<any[]>(`${this.base}${query ? '?' + query : ''}`);
  }
  create(payload: any) {
    return this.http.post<any>(this.base, payload);
  }
  join(id: string) {
    return this.http.post<any>(`${this.base}/${id}/join`, {});
  }
  remove(id: string) {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
