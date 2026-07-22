import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private http: HttpClient) {}

  updateProfile(payload: { name?: string; avatarColor?: string }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/auth/profile`, payload);
  }

  updatePassword(payload: { currentPassword?: string; newPassword?: string }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/auth/password`, payload);
  }

  uploadAvatar(formData: FormData): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/avatar`, formData);
  }
}
