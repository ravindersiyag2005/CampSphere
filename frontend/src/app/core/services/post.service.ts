import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PostService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPosts(myPrivate: boolean = false): Observable<any[]> {
    let url = `${this.apiUrl}/posts`;
    if (myPrivate) {
      url += '?myPrivate=true';
    }
    return this.http.get<any[]>(url).pipe(
      map(posts => posts.map(post => {
        if (post.imageUrl && post.imageUrl.startsWith('http://')) {
          post.imageUrl = post.imageUrl.replace('http://', 'https://');
        }
        return post;
      }))
    );
  }

  createPost(data: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/posts`, data);
  }

  toggleLike(postId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/posts/${postId}/like`, {});
  }

  addComment(postId: string, text: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/posts/${postId}/comments`, { text });
  }

  deletePost(postId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/posts/${postId}`);
  }

  checkUnread(): Observable<{ hasUnread: boolean }> {
    return this.http.get<{ hasUnread: boolean }>(`${this.apiUrl}/auth/unread-photoholic`);
  }

  markSeen(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/mark-photoholic-seen`, {});
  }
}
