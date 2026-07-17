import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  private base = `${environment.apiUrl}/resources`;
  constructor(private http: HttpClient) {}

  list(params: { type?: string; subject?: string; semester?: string; search?: string } = {}) {
    let query = Object.entries(params)
      .filter(([, v]) => !!v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join('&');
    return this.http.get<any[]>(`${this.base}${query ? '?' + query : ''}`);
  }

  subjects() {
    return this.http.get<string[]>(`${this.base}/subjects`);
  }

  upload(formData: FormData) {
    return this.http.post<any>(this.base, formData);
  }

  upvote(id: string) {
    return this.http.post<any>(`${this.base}/${id}/upvote`, {});
  }

  downloadUrl(id: string) {
    return `${this.base}/${id}/download`;
  }
}
