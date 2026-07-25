import { Component, OnInit, OnDestroy, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AnimationService } from '../../core/services/animation.service';
import { SocketService } from '../../core/services/socket.service';
import { environment } from '../../../environments/environment';

interface Post {
  _id: string;
  imageUrl: string;
  caption?: string;
  isPrivate?: boolean;
  uploadedBy: {
    _id: string;
    name: string;
    avatarColor: string;
  };
  likes: string[];
  comments: {
    _id?: string;
    text: string;
    commentedBy: {
      _id: string;
      name: string;
    };
    createdAt: string;
  }[];
  createdAt: string;
  liked?: boolean;
  likeHeartActive?: boolean;
}

@Component({
  selector: 'app-photoholic',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="photoholic-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 *ngIf="activeTab === 'public'">Photoholic</h1>
          <h1 *ngIf="activeTab === 'private'">Private Inbox</h1>
          <p class="text-muted" *ngIf="activeTab === 'public'">Capture and share moments from around the campus</p>
          <p class="text-muted" *ngIf="activeTab === 'private'">Photos shared privately with you</p>
        </div>
        <div class="flex gap-12">
          <button *ngIf="activeTab === 'public'" class="btn btn-outline" (click)="setTab('private')">
            📥 Inbox
          </button>
          <button *ngIf="activeTab === 'private'" class="btn btn-outline" (click)="setTab('public')">
            🔙 Public Feed
          </button>
          <button class="btn btn-primary" (click)="openUploadModal()">
            <span>➕</span> Share Photo
          </button>
        </div>
      </div>

      <!-- Feed Container -->
      <div class="feed-grid">
        <div class="posts-list" #postsList>
          <div *ngIf="loading()" class="text-center py-32">
            <span class="spinner spinner-lg"></span>
            <p class="mt-8 text-muted">Loading posts...</p>
          </div>

          <div *ngIf="!loading() && posts.length === 0" class="empty-state card text-center py-48">
            <svg class="empty-state-icon" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <h3>No posts yet</h3>
            <p class="text-muted">Be the first to share a memory from your campus!</p>
            <button class="btn btn-primary mt-16" (click)="openUploadModal()">Share the First Photo</button>
          </div>

          <!-- Post Cards -->
          <div class="post-card card" *ngFor="let post of posts" #postCard>
            <div class="post-header">
              <div class="user-avatar" [style.background-color]="post.uploadedBy?.avatarColor || '#888'">
                {{ (post.uploadedBy?.name || 'U').substring(0, 1).toUpperCase() }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ post.uploadedBy?.name || 'Unknown User' }}</span>
                <span class="post-time">{{ formatTime(post.createdAt) }}</span>
              </div>
              <button 
                *ngIf="canDelete(post)" 
                class="delete-btn" 
                title="Delete Post"
                (click)="deletePost(post._id)"
              >
                🗑️
              </button>
            </div>

            <!-- Image Area with Double Click to Like and click to zoom -->
            <div class="image-wrapper" (dblclick)="triggerDoubleLike(post)" (click)="openLightbox(getFileUrl(post.imageUrl))">
              <img [src]="getFileUrl(post.imageUrl)" alt="Campus moment" class="post-img" />
              <div class="double-like-heart" [class.active]="post.likeHeartActive">
                <svg viewBox="0 0 24 24" class="double-like-svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </div>
              <div class="zoom-indicator">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm" style="margin-right: 4px; vertical-align: text-bottom;"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                View Fullsize
              </div>
            </div>

            <!-- Post Details -->
            <div class="post-details">
              <div class="actions-bar">
                <ng-container *ngIf="activeTab === 'public'">
                  <button class="action-btn" [class.liked]="post.liked" (click)="toggleLike(post)">
                    <svg *ngIf="!post.liked" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <svg *ngIf="post.liked" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" class="icon heart-filled"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    <span>{{ post.likes.length }}</span>
                  </button>
                  <button class="action-btn comment-trigger" (click)="openComments(post)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <span>{{ post.comments.length }}</span>
                  </button>
                </ng-container>
                <button class="action-btn ml-auto" [class.ml-auto]="activeTab === 'public'" (click)="downloadImage(post.imageUrl, 'photoholic-' + post._id + '.jpg')" title="Download high quality">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  <span>Download</span>
                </button>
              </div>

              <div class="caption-block" *ngIf="post.caption">
                <span class="caption-user">{{ post.uploadedBy?.name || 'Unknown User' }}</span>
                <span class="caption-text">{{ post.caption }}</span>
              </div>

              <!-- Quick Comments Preview -->
              <div class="comments-preview" *ngIf="post.comments.length > 0">
                <div class="preview-comment" *ngFor="let comm of post.comments.slice(-2)">
                  <span class="comment-user">{{ comm.commentedBy?.name || 'Unknown User' }}</span>
                  <span class="comment-text">{{ comm.text }}</span>
                </div>
                <button 
                  *ngIf="post.comments.length > 2" 
                  class="view-all-link"
                  (click)="openComments(post)"
                >
                  View all {{ post.comments.length }} comments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Modal Backdrop & Content -->
      <div class="modal-backdrop" *ngIf="uploadModalOpen()">
        <div class="modal-card card" #uploadModal>
          <div class="modal-header">
            <h3>Share Campus Moment</h3>
            <button class="close-btn" (click)="closeUploadModal()">✕</button>
          </div>

          <form (ngSubmit)="submitPost()" #uploadForm="ngForm">
            <div class="field">
              <label>Select Photo</label>
              <div class="upload-zone" (click)="fileInput.click()">
                <input 
                  type="file" 
                  #fileInput 
                  (change)="onFileSelected($event)" 
                  accept="image/*" 
                  style="display: none;" 
                />
                
                <div *ngIf="!imagePreview" class="upload-placeholder">
                  <span class="upload-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-lg"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  </span>
                  <span class="btn btn-outline btn-sm">Browse Image</span>
                  <span class="text-xs text-muted mt-4">JPG, PNG, WEBP, or GIF up to 15MB</span>
                </div>
                
                <img *ngIf="imagePreview" [src]="imagePreview" class="preview-img" alt="Upload preview" />
              </div>
            </div>

            <div class="field">
              <label for="caption">Caption / Description</label>
              <textarea 
                class="input textarea" 
                id="caption" 
                name="caption" 
                [(ngModel)]="newCaption" 
                placeholder="What is happening in this photo?..."
                rows="3"
              ></textarea>
            </div>

            <div class="field mt-16">
              <label>Sharing Options</label>
              <div class="flex gap-16" style="margin-top: 8px;">
                <label class="flex items-center gap-8 cursor-pointer">
                  <input type="radio" name="privacy" [value]="false" [(ngModel)]="isPrivate" /> 🌍 Public Feed
                </label>
                <label class="flex items-center gap-8 cursor-pointer">
                  <input type="radio" name="privacy" [value]="true" [(ngModel)]="isPrivate" /> 🔒 Send Privately
                </label>
              </div>
            </div>

            <div class="field mt-16" *ngIf="isPrivate" style="position: relative;">
              <label>Send to (College IDs)</label>
              <div class="flex gap-8 mb-8" style="flex-wrap: wrap;" *ngIf="sharedWith.length > 0">
                <span class="badge badge-coral flex items-center gap-4" *ngFor="let id of sharedWith">
                  {{ id }} <span class="cursor-pointer" style="padding-left: 4px;" (click)="removeSharedUser(id)">✕</span>
                </span>
              </div>
              <div class="flex gap-8">
                <input class="input" name="searchQuery" [(ngModel)]="searchQuery" (keyup)="onSearch()" (keydown.enter)="addManualUser($event)" placeholder="Search or enter College ID..." autocomplete="off" />
                <button type="button" class="btn btn-ghost" (click)="addManualUser($event)">Add</button>
              </div>
              <div class="dropdown-menu" *ngIf="showDropdown && searchResults().length > 0">
                <div class="dropdown-item flex items-center gap-8" *ngFor="let u of searchResults()" (click)="selectUser(u)">
                  <div class="avatar avatar-sm" [style.background]="u.avatarColor">{{ initials(u.name) }}</div>
                  <div>
                    <div class="font-bold">{{ u.name }}</div>
                    <div class="text-sm text-muted">{{ u.collegeId }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-outline" (click)="closeUploadModal()" [disabled]="uploading()">Cancel</button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="!selectedFile || uploading()"
              >
                <span class="spinner" *ngIf="uploading()"></span>
                {{ uploading() ? 'Posting...' : 'Post Moment' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Comments Slide-out Sheet -->
      <div class="comments-sheet-backdrop" *ngIf="commentsSheetOpen()" (click)="closeComments()">
        <div class="comments-sheet card" (click)="$event.stopPropagation()" #commentsSheet>
          <div class="sheet-header">
            <h3>Comments</h3>
            <button class="close-btn" (click)="closeComments()">✕</button>
          </div>

          <!-- Comments Feed -->
          <div class="sheet-content">
            <div *ngIf="selectedPost()?.comments?.length === 0" class="empty-comments">
              <span>💬</span>
              <p class="text-muted">No comments yet. Start the conversation!</p>
            </div>

            <div class="comment-item" *ngFor="let comm of selectedPost()?.comments">
              <div class="comment-avatar" [style.background-color]="comm.commentedBy?._id === currentUser?.id ? '#6c5ce7' : '#00b8a9'">
                {{ (comm.commentedBy?.name || 'U').substring(0,1).toUpperCase() }}
              </div>
              <div class="comment-body">
                <div class="comment-meta">
                  <span class="commenter-name">{{ comm.commentedBy?.name || 'Unknown User' }}</span>
                  <span class="commenter-time">{{ formatTime(comm.createdAt) }}</span>
                </div>
                <p class="comment-text-content">{{ comm.text }}</p>
              </div>
            </div>
          </div>

          <!-- Comment Input -->
          <div class="sheet-footer">
            <form (ngSubmit)="submitComment()" #commForm="ngForm">
              <input 
                class="input comment-input" 
                name="commentText" 
                [(ngModel)]="newCommentText" 
                placeholder="Write a comment..." 
                required 
                autocomplete="off"
              />
              <button class="btn btn-primary send-comment-btn" type="submit" [disabled]="!newCommentText.trim() || commenting()">
                {{ commenting() ? '...' : 'Send' }}
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Lightbox Modal -->
      <div class="lightbox-overlay" *ngIf="lightboxOpen()" (click)="closeLightbox()">
        <button class="lightbox-close" (click)="closeLightbox()">✕</button>
        <img [src]="lightboxImgUrl" class="lightbox-img" (click)="$event.stopPropagation()" alt="Full view" />
      </div>
    </div>
  `,
  styles: [`
    .icon { width: 16px; height: 16px; }
    .icon-sm { width: 14px; height: 14px; }
    .icon-lg { width: 40px; height: 40px; color: var(--text-muted); margin-bottom: 8px; display: block; }
    .heart-filled { color: #ff4757; fill: #ff4757; stroke: #ff4757; }
    .double-like-svg { width: 100px; height: 100px; color: #ff4757; fill: #ff4757; filter: drop-shadow(0 10px 20px rgba(255, 71, 87, 0.4)); }

    .photoholic-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px 16px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }

    .feed-grid {
      margin-top: 16px;
    }

    .posts-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .dropdown-menu { position: absolute; top: 100%; left: 0; right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; z-index: 10; max-height: 200px; overflow-y: auto; padding: 8px 0; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    html[data-theme='dark'] .dropdown-menu { border-color: rgba(255,255,255,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    .dropdown-item { padding: 8px 16px; cursor: pointer; transition: background 0.2s; }
    .dropdown-item:hover { background: var(--surface-alt); }
    html[data-theme='dark'] .dropdown-item:hover { background: rgba(255,255,255,0.05); }

    .post-card {
      padding: 0;
      overflow: hidden;
      border: 1px solid var(--border);
      background: var(--surface);
      border-radius: 16px;
    }
    html[data-theme='dark'] .post-card { background: #0b0e14; border-color: rgba(255, 255, 255, 0.08); }

    .post-header {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
    }
    html[data-theme='dark'] .post-header { border-color: rgba(255, 255, 255, 0.05); }

    .user-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #fff;
      margin-right: 12px;
      font-size: 15px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .user-name {
      font-weight: 600;
      font-size: 14.5px;
    }

    .post-time {
      font-size: 11.5px;
      color: var(--text-muted);
      margin-top: 1px;
    }

    .delete-btn {
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .delete-btn:hover {
      opacity: 1;
    }

    .image-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      background: var(--surface-alt);
      overflow: hidden;
      cursor: pointer;
    }
    html[data-theme='dark'] .image-wrapper { background: #090a14; }

    .post-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .double-like-heart {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      font-size: 80px;
      pointer-events: none;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
      opacity: 0;
      z-index: 10;
    }

    .double-like-heart.active {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1;
    }

    .post-details {
      padding: 16px;
    }

    .actions-bar {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
    }

    .action-btn {
      background: var(--surface-alt);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 6px 14px;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    html[data-theme='dark'] .action-btn { background: rgba(255, 255, 255, 0.04); border-color: rgba(255, 255, 255, 0.08); }

    .action-btn:hover {
      background: var(--border);
      transform: translateY(-1px);
    }
    html[data-theme='dark'] .action-btn:hover { background: rgba(255, 255, 255, 0.08); }

    .action-btn.liked {
      background: rgba(255, 107, 91, 0.1);
      border-color: rgba(255, 107, 91, 0.3);
    }

    .caption-block {
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .caption-user, .comment-user, .commenter-name {
      font-weight: 600;
      margin-right: 8px;
    }

    .comments-preview {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border-top: 1px solid var(--border);
      padding-top: 12px;
      font-size: 13px;
    }
    html[data-theme='dark'] .comments-preview { border-color: rgba(255, 255, 255, 0.04); }

    .preview-comment {
      line-height: 1.4;
    }

    .view-all-link {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 12.5px;
      padding: 0;
      text-align: left;
      cursor: pointer;
      width: fit-content;
      margin-top: 4px;
    }

    .view-all-link:hover {
      color: var(--text);
      text-decoration: underline;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .modal-card {
      width: 100%;
      max-width: 460px;
      padding: 24px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
    }
    html[data-theme='dark'] .modal-card { background: #0b0e14; border-color: rgba(255, 255, 255, 0.1); }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .modal-header h3 {
      font-size: 18px;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 20px;
      cursor: pointer;
    }

    .close-btn:hover {
      color: var(--text);
    }

    .upload-zone {
      border: 2px dashed var(--border);
      border-radius: 12px;
      aspect-ratio: 16 / 9;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      overflow: hidden;
      background: var(--surface-alt);
      transition: border-color 0.2s;
    }
    html[data-theme='dark'] .upload-zone { border-color: rgba(255, 255, 255, 0.15); background: rgba(255, 255, 255, 0.02); }

    .upload-zone:hover {
      border-color: var(--violet);
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .upload-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .textarea {
      resize: none;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    /* Comments Sheet */
    .comments-sheet-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
    }

    .comments-sheet {
      width: 100%;
      max-width: 420px;
      height: 100%;
      background: var(--surface);
      border-left: 1px solid var(--border);
      border-radius: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    html[data-theme='dark'] .comments-sheet { background: #0b0e14; border-color: rgba(255, 255, 255, 0.08); }

    .sheet-header {
      padding: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sheet-header h3 {
      font-size: 18px;
      margin: 0;
    }

    .sheet-content {
      flex-grow: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .comment-item {
      display: flex;
      gap: 12px;
    }

    .comment-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .comment-body {
      display: flex;
      flex-direction: column;
    }

    .comment-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }

    .commenter-name {
      font-weight: 600;
      font-size: 13px;
    }

    .commenter-time {
      font-size: 10.5px;
      color: var(--text-muted);
    }

    .comment-text-content {
      font-size: 13.5px;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.9);
    }

    .empty-comments {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-top: 64px;
      font-size: 14px;
    }

    .empty-comments span {
      font-size: 32px;
      margin-bottom: 8px;
    }

    .sheet-footer {
      padding: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(0, 0, 0, 0.1);
    }

    .sheet-footer form {
      display: flex;
      gap: 10px;
    }

    .comment-input {
      flex-grow: 1;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 13.5px;
    }

    .send-comment-btn {
      border-radius: 20px;
      padding: 0 16px;
      font-size: 13.5px;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    /* Tablet and Mobile compatibility */
    @media (max-width: 880px) {
      .photoholic-container {
        padding: 16px 8px;
      }
      
      .comments-sheet-backdrop {
        justify-content: center;
        align-items: flex-end;
      }

      .comments-sheet {
        max-width: 100%;
        height: 75vh;
        border-radius: 20px 20px 0 0;
        border-left: none;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .lightbox-close {
        top: 16px;
        right: 16px;
        width: 38px;
        height: 38px;
        font-size: 16px;
      }
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .page-header .btn {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .modal-card {
        padding: 16px;
      }
      .upload-zone {
        aspect-ratio: 4 / 3;
      }
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .zoom-indicator {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: rgba(6, 7, 13, 0.75);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
      font-family: var(--font-mono);
    }
    .image-wrapper:hover .zoom-indicator {
      opacity: 1;
    }
    
    .lightbox-overlay {
      position: fixed;
      inset: 0;
      background: rgba(5, 6, 10, 0.95);
      backdrop-filter: blur(15px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      cursor: zoom-out;
      animation: fadeIn 0.2s ease;
    }
    .lightbox-img {
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
      cursor: default;
      animation: zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .lightbox-close {
      position: absolute;
      top: 24px;
      right: 24px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 20px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .lightbox-close:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: scale(1.1);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes zoomIn {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `],
})
export class PhotoholicComponent implements OnInit, OnDestroy {
  @ViewChild('postsList') postsListRef?: ElementRef<HTMLElement>;
  
  posts: Post[] = [];
  loading = signal(true);
  currentUser: any = null;
  activeTab: 'public' | 'private' = 'public';

  // Upload modal state
  uploadModalOpen = signal(false);
  uploading = signal(false);
  newCaption = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isPrivate = false;
  sharedWith: string[] = [];

  // Autocomplete state
  searchQuery = '';
  searchResults = signal<any[]>([]);
  showDropdown = false;
  searchTimeout: any;

  // Comments sheet state
  commentsSheetOpen = signal(false);
  commenting = signal(false);
  newCommentText = '';
  selectedPost = signal<Post | null>(null);

  // Lightbox state
  lightboxOpen = signal(false);
  lightboxImgUrl = '';

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private toast: ToastService,
    private anim: AnimationService,
    private socketService: SocketService
  ) {}

  private socket: any;

  ngOnInit() {
    this.currentUser = this.authService.currentUser();
    this.loadPosts();
    // Clear unread badge
    this.postService.markSeen().subscribe();
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket = this.socketService.instance;
    
    this.socket.on('photoholic:newPost', (post: any) => {
      if ((this.activeTab === 'private' && post.isPrivate) || (this.activeTab === 'public' && !post.isPrivate)) {
        if (!this.posts.some(p => p._id === post._id)) {
           const p = { ...post, liked: false, likeHeartActive: false };
           if (p.imageUrl && p.imageUrl.startsWith('http://')) {
             p.imageUrl = p.imageUrl.replace('http://', 'https://');
           }
           this.posts.unshift(p);
        }
      }
    });

    this.socket.on('photoholic:updateLikes', (data: any) => {
      const { postId, likesCount, likedBy, isLiked } = data;
      const p = this.posts.find(p => p._id === postId);
      if (p) {
        if (likedBy !== this.currentUser?.id) {
           if (isLiked && !p.likes.includes(likedBy)) p.likes.push(likedBy);
           if (!isLiked) p.likes = p.likes.filter(id => id !== likedBy);
        }
      }
    });

    this.socket.on('photoholic:newComment', (data: any) => {
      const { postId, comment } = data;
      const p = this.posts.find(p => p._id === postId);
      if (p) {
        if (comment.commentedBy._id !== this.currentUser?.id) {
           if (!p.comments.some(c => c._id === comment._id)) {
             p.comments.push(comment);
           }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.off('photoholic:newPost');
      this.socket.off('photoholic:updateLikes');
      this.socket.off('photoholic:newComment');
    }
  }

  setTab(tab: 'public' | 'private') {
    this.activeTab = tab;
    this.loadPosts();
  }

  loadPosts() {
    this.loading.set(true);
    this.postService.getPosts(this.activeTab === 'private').subscribe({
      next: (res) => {
        this.posts = res.map((p) => ({
          ...p,
          liked: p.likes.includes(this.currentUser?.id),
          likeHeartActive: false,
        }));
        this.loading.set(false);
        // Stagger animation
        setTimeout(() => {
          if (this.postsListRef) {
            this.anim.staggerIn(Array.from(this.postsListRef.nativeElement.children), { y: 20 });
          }
        }, 50);
      },
      error: (err) => {
        this.toast.error('Failed to load posts.');
        this.loading.set(false);
      },
    });
  }

  canDelete(post: Post): boolean {
    if (!this.currentUser) return false;
    return post.uploadedBy?._id === this.currentUser.id || this.currentUser.role === 'admin';
  }

  deletePost(id: string) {
    if (!confirm('Are you sure you want to delete this moment?')) return;
    this.postService.deletePost(id).subscribe({
      next: () => {
        this.posts = this.posts.filter((p) => p._id !== id);
        this.toast.success('Moment deleted successfully.');
        if (this.selectedPost()?._id === id) {
          this.closeComments();
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to delete post.');
      },
    });
  }

  // Like Toggle
  toggleLike(post: Post) {
    const origLiked = post.liked;
    post.liked = !post.liked;
    if (post.liked) {
      post.likes.push(this.currentUser.id);
    } else {
      post.likes = post.likes.filter((id) => id !== this.currentUser.id);
    }

    this.postService.toggleLike(post._id).subscribe({
      next: (res) => {
        // Sync response
        post.liked = res.liked;
        // Make sure counter matches
        if (res.liked && !post.likes.includes(this.currentUser.id)) {
          post.likes.push(this.currentUser.id);
        } else if (!res.liked) {
          post.likes = post.likes.filter((id) => id !== this.currentUser.id);
        }
      },
      error: () => {
        // Rollback
        post.liked = origLiked;
        if (origLiked && !post.likes.includes(this.currentUser.id)) {
          post.likes.push(this.currentUser.id);
        } else if (!origLiked) {
          post.likes = post.likes.filter((id) => id !== this.currentUser.id);
        }
        this.toast.error('Failed to update like.');
      },
    });
  }

  // Double Click Like Animation
  triggerDoubleLike(post: Post) {
    if (!post.liked) {
      this.toggleLike(post);
    }
    post.likeHeartActive = true;
    setTimeout(() => {
      post.likeHeartActive = false;
    }, 800);
  }

  // Comments Operations
  openComments(post: Post) {
    this.selectedPost.set(post);
    this.newCommentText = '';
    this.commentsSheetOpen.set(true);
  }

  closeComments() {
    this.commentsSheetOpen.set(false);
    this.selectedPost.set(null);
  }

  submitComment() {
    const post = this.selectedPost();
    if (!post || !this.newCommentText.trim()) return;

    const commentText = this.newCommentText.trim();
    this.newCommentText = '';
    this.commenting.set(true);

    // Optimistic UI Update
    const tempId = 'temp-' + Date.now();
    const mockComment = {
      _id: tempId,
      text: commentText,
      commentedBy: {
        _id: this.currentUser.id,
        name: this.currentUser.name
      },
      createdAt: new Date().toISOString()
    };
    post.comments.push(mockComment);

    this.postService.addComment(post._id, commentText).subscribe({
      next: (comment) => {
        // Replace temp comment with real one from server
        const idx = post.comments.findIndex(c => c._id === tempId);
        if (idx !== -1) {
          post.comments[idx] = comment;
        }
        this.commenting.set(false);
      },
      error: (err) => {
        // Remove temp comment on failure
        post.comments = post.comments.filter(c => c._id !== tempId);
        this.toast.error('Failed to add comment.');
        this.commenting.set(false);
      },
    });
  }

  // Upload operations
  openUploadModal() {
    this.newCaption = '';
    this.selectedFile = null;
    this.imagePreview = null;
    this.isPrivate = false;
    this.sharedWith = [];
    this.searchQuery = '';
    this.uploadModalOpen.set(true);
  }

  closeUploadModal() {
    this.uploadModalOpen.set(false);
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    if (!this.searchQuery.trim()) {
      this.searchResults.set([]);
      this.showDropdown = false;
      return;
    }
    this.searchTimeout = setTimeout(() => {
      this.authService.searchUsers(this.searchQuery).subscribe((res) => {
        this.searchResults.set(res);
        this.showDropdown = true;
      });
    }, 300);
  }

  selectUser(user: any) {
    if (!this.sharedWith.includes(user.collegeId)) {
      this.sharedWith.push(user.collegeId);
    }
    this.searchQuery = '';
    this.showDropdown = false;
  }

  addManualUser(event: Event) {
    event.preventDefault();
    if (this.searchQuery.trim() && !this.sharedWith.includes(this.searchQuery.trim())) {
      this.sharedWith.push(this.searchQuery.trim());
    }
    this.searchQuery = '';
    this.showDropdown = false;
  }

  removeSharedUser(id: string) {
    this.sharedWith = this.sharedWith.filter(u => u !== id);
  }

  submitPost() {
    if (!this.selectedFile) {
      this.toast.error('Please select a photo.');
      return;
    }

    this.uploading.set(true);
    const fd = new FormData();
    fd.append('photo', this.selectedFile);
    fd.append('caption', this.newCaption);
    if (this.isPrivate) {
      fd.append('isPrivate', 'true');
      fd.append('sharedWith', this.sharedWith.join(','));
    }

    this.postService.createPost(fd).subscribe({
      next: (newPost) => {
        // Prep model properties
        const prep = {
          ...newPost,
          liked: false,
          likeHeartActive: false,
        };
        // Add to front of posts if it matches the current tab view
        if ((this.activeTab === 'private' && this.isPrivate) || (this.activeTab === 'public' && !this.isPrivate)) {
          if (!this.posts.some(p => p._id === newPost._id)) {
            this.posts.unshift(prep);
          }
        }
        
        this.toast.success('Moment shared successfully!');
        this.uploading.set(false);
        this.closeUploadModal();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to create post.');
        this.uploading.set(false);
      },
    });
  }

  // Utilities
  formatTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  openLightbox(url: string) {
    this.lightboxImgUrl = url;
    this.lightboxOpen.set(true);
  }

  closeLightbox() {
    this.lightboxOpen.set(false);
    this.lightboxImgUrl = '';
  }

  initials(name: string): string {
    if (!name) return '';
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  downloadImage(url: string, filename: string) {
    const fullUrl = this.getFileUrl(url);
    const a = document.createElement('a');
    a.href = fullUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  getFileUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.replace(/\\/g, '/');
    const apiBase = environment.apiUrl.replace('/api', '');
    return `${apiBase}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
  }
}
