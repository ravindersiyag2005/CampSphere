import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PostService } from '../../core/services/post.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AnimationService } from '../../core/services/animation.service';

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
              <div class="user-avatar" [style.background-color]="post.uploadedBy.avatarColor">
                {{ post.uploadedBy.name.substring(0, 1).toUpperCase() }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ post.uploadedBy.name }}</span>
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
            <div class="image-wrapper" (dblclick)="triggerDoubleLike(post)" (click)="openLightbox(post.imageUrl)">
              <img [src]="post.imageUrl" alt="Campus moment" class="post-img" />
              <div class="double-like-heart" [class.active]="post.likeHeartActive">❤️</div>
              <div class="zoom-indicator">🔍 View Fullsize</div>
            </div>

            <!-- Post Details -->
            <div class="post-details">
              <div class="actions-bar">
                <ng-container *ngIf="activeTab === 'public'">
                  <button class="action-btn" [class.liked]="post.liked" (click)="toggleLike(post)">
                    {{ post.liked ? '❤️' : '🤍' }} <span>{{ post.likes.length }}</span>
                  </button>
                  <button class="action-btn comment-trigger" (click)="openComments(post)">
                    💬 <span>{{ post.comments.length }}</span>
                  </button>
                </ng-container>
                <button class="action-btn ml-auto" [class.ml-auto]="activeTab === 'public'" (click)="downloadImage(post.imageUrl, 'photoholic-' + post._id + '.jpg')" title="Download high quality">
                  ⬇️ Download
                </button>
              </div>

              <div class="caption-block" *ngIf="post.caption">
                <span class="caption-user">{{ post.uploadedBy.name }}</span>
                <span class="caption-text">{{ post.caption }}</span>
              </div>

              <!-- Quick Comments Preview -->
              <div class="comments-preview" *ngIf="post.comments.length > 0">
                <div class="preview-comment" *ngFor="let comm of post.comments.slice(-2)">
                  <span class="comment-user">{{ comm.commentedBy.name }}</span>
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
                  <span class="upload-icon">📷</span>
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
                {{ uploading() ? 'Posting...' : 'Post Momemt' }}
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
              <div class="comment-avatar" [style.background-color]="comm.commentedBy._id === currentUser?.id ? '#6c5ce7' : '#00b8a9'">
                {{ comm.commentedBy.name.substring(0,1).toUpperCase() }}
              </div>
              <div class="comment-body">
                <div class="comment-meta">
                  <span class="commenter-name">{{ comm.commentedBy.name }}</span>
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

    .dropdown-menu { position: absolute; top: 100%; left: 0; right: 0; background: var(--surface); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; z-index: 10; max-height: 200px; overflow-y: auto; padding: 8px 0; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    .dropdown-item { padding: 8px 16px; cursor: pointer; transition: background 0.2s; }
    .dropdown-item:hover { background: rgba(255,255,255,0.05); }

    .post-card {
      padding: 0;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: var(--shell);
      border-radius: 16px;
    }

    .post-header {
      display: flex;
      align-items: center;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

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
      background: #090a14;
      overflow: hidden;
      cursor: pointer;
    }

    .post-img {
      width: 100%;
      height: auto;
      max-height: 550px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
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
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
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

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-1px);
    }

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
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      padding-top: 12px;
      font-size: 13px;
    }

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
      background: var(--shell);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
    }

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
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      aspect-ratio: 16 / 9;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.02);
      transition: border-color 0.2s;
    }

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
      background: var(--shell);
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

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
export class PhotoholicComponent implements OnInit {
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
    private anim: AnimationService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUser();
    this.loadPosts();
    // Clear unread badge
    this.postService.markSeen().subscribe();
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
    return post.uploadedBy._id === this.currentUser.id || this.currentUser.role === 'admin';
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
          this.posts.unshift(prep);
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
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
