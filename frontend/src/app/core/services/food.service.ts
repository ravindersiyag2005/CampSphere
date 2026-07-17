import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FoodService {
  private base = `${environment.apiUrl}/food`;
  constructor(private http: HttpClient) {}

  list(params: { locationType?: string; tag?: string; search?: string } = {}) {
    let query = Object.entries(params)
      .filter(([, v]) => !!v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join('&');
    return this.http.get<any[]>(`${this.base}${query ? '?' + query : ''}`);
  }
  create(payload: any) {
    return this.http.post<any>(this.base, payload);
  }
  upvote(id: string) {
    return this.http.post<any>(`${this.base}/${id}/upvote`, {});
  }
  review(id: string, payload: { rating: number; comment: string }) {
    return this.http.post<any>(`${this.base}/${id}/review`, payload);
  }
  reviews(id: string) {
    return this.http.get<any[]>(`${this.base}/${id}/reviews`);
  }
}
