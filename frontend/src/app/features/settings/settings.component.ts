import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ChatService } from '../../core/services/chat.service';
import { ToastService } from '../../core/services/toast.service';
import { environment } from '../../../environments/environment';

interface RoomAliasItem {
  _id: string;
  roomId: { _id: string; name: string };
  alias: string;
  avatarColor: string;
  isEditing?: boolean;
  editValue?: string;
  loading?: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Lightbox Modal for DP Preview -->
    <div class="lightbox-overlay" *ngIf="previewOpen() && auth.currentUser()?.avatarUrl" (click)="previewOpen.set(false)">
      <div class="lightbox-content" (click)="$event.stopPropagation()">
        <button class="lightbox-close" (click)="previewOpen.set(false)">×</button>
        <div class="lightbox-img" 
             [style.background-color]="auth.currentUser()?.avatarColor" 
             [style.background-image]="'url(' + getAvatarUrl(auth.currentUser()?.avatarUrl || '') + ')'"
             [style.background-size]="'cover'"
             [style.background-position]="'top center'"
             [style.background-repeat]="'no-repeat'">
        </div>
        <p class="lightbox-caption mt-12">Full Profile Picture Preview</p>
      </div>
    </div>

    <div class="page page--settings py-24 px-32">
      <div class="page-header mb-24">
        <div class="eyebrow">
          <svg class="eyebrow-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          SYSTEM / SETTINGS
        </div>
        <h1>Settings & Customization</h1>
        <p class="text-muted">Manage your profile details, display photo, and customize your anonymous chat identities.</p>
      </div>

      <div class="settings-grid" *ngIf="auth.currentUser() as u">
        
        <!-- Left Side: Profile & Security -->
        <div class="settings-left">
          
          <!-- Card: Profile Details -->
          <div class="card settings-card">
            <h2>Personal Profile</h2>
            <p class="card-subtitle mb-20">Your primary display information.</p>

            <div class="profile-avatar-section mb-24">
              <div class="avatar-preview-container" (click)="fileInput.click()" title="Click to upload photo">
                <div class="avatar-preview" 
                     [style.background-color]="u.avatarColor" 
                     [style.background-image]="u.avatarUrl ? 'url(' + getAvatarUrl(u.avatarUrl) + ')' : ''" 
                     [style.background-size]="'cover'" 
                     [style.background-position]="'top center'"
                     [style.background-repeat]="'no-repeat'">
                  <span *ngIf="!u.avatarUrl" class="initials">{{ initials(u.name) }}</span>
                </div>
                <div class="avatar-upload-overlay" (click)="$event.stopPropagation(); fileInput.click()" title="Upload new photo">
                  <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </div>
              </div>
              <div class="avatar-info">
                <h3>Display Picture</h3>
                <p class="text-sm text-muted">Upload a custom profile photo (PNG, JPG, JPEG, WEBP up to 15MB).</p>
                <input #fileInput type="file" (change)="onAvatarSelected($event)" accept="image/*" style="display: none;">
                <div class="avatar-btn-row mt-8">
                  <button type="button" class="btn btn-secondary btn-sm" (click)="fileInput.click()" [disabled]="uploadingAvatar()">
                    {{ uploadingAvatar() ? 'Uploading...' : 'Change Photo' }}
                  </button>
                  <button type="button" class="btn btn-ghost btn-sm" *ngIf="u.avatarUrl" (click)="previewOpen.set(true)">
                    Preview DP
                  </button>
                </div>
              </div>
            </div>



            <form (ngSubmit)="saveProfile()">
              <div class="field mb-16">
                <label for="profileName">Real Name</label>
                <input id="profileName" type="text" class="input" [(ngModel)]="profileName" name="name" required>
              </div>

              <div class="field mb-16">
                <label>Avatar Base Color</label>
                <div class="color-palette">
                  <button type="button" 
                          *ngFor="let color of colors" 
                          class="color-swatch"
                          [style.background]="color"
                          [class.selected]="selectedColor === color"
                          (click)="selectedColor = color">
                  </button>
                </div>
              </div>

  

              <button type="submit" class="btn btn-primary" [disabled]="savingProfile()">
                {{ savingProfile() ? 'Saving...' : 'Save Profile Changes' }}
              </button>
            </form>
          </div>

          <!-- Card: Security Settings -->
          <div class="card settings-card mt-24">
            <h2>Security & Password</h2>
            <p class="card-subtitle mb-20">Update your access credentials.</p>

            <form (ngSubmit)="changePassword()">
              <div class="field mb-16">
                <label for="currPass">Current Password</label>
                <input id="currPass" type="password" class="input" [(ngModel)]="currentPassword" name="currentPassword" required>
              </div>

              <div class="field mb-16">
                <label for="newPass">New Password</label>
                <input id="newPass" type="password" class="input" [(ngModel)]="newPassword" name="newPassword" required>
              </div>

              <div class="field mb-20">
                <label for="confirmPass">Confirm New Password</label>
                <input id="confirmPass" type="password" class="input" [(ngModel)]="confirmPassword" name="confirmPassword" required>
              </div>

              <button type="submit" class="btn btn-secondary" [disabled]="savingPassword()">
                {{ savingPassword() ? 'Updating Password...' : 'Change Password' }}
              </button>
            </form>
          </div>

        </div>

        <!-- Right Side: Room Specific Aliases -->
        <div class="settings-right">
          
          <div class="card settings-card h-full">
            <h2>Room Identities</h2>
            <p class="card-subtitle mb-20">Manage your active anonymous aliases for individual chat rooms.</p>

            <div class="aliases-list">
              <div class="loading-state" *ngIf="loadingAliases()">
                <span class="spinner"></span>
                <p class="mt-8 text-muted">Retrieving room aliases...</p>
              </div>

              <div class="empty-state" *ngIf="!loadingAliases() && aliases().length === 0">
                <svg class="empty-state-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p>No active room aliases found. Join a chat room to establish an identity.</p>
              </div>

              <div class="alias-item card mb-12" *ngFor="let item of aliases()">
                <div class="alias-row">
                  <div class="alias-details">
                    <div class="room-name"># {{ item.roomId.name || 'Unknown Room' }}</div>
                    <div class="alias-tag-row">
                      <span class="avatar-dot" [style.background]="item.avatarColor"></span>
                      <span class="alias-name" *ngIf="!item.isEditing">{{ item.alias }}</span>
                      <input *ngIf="item.isEditing" type="text" class="input form-input-sm" [(ngModel)]="item.editValue" name="editAlias" required>
                    </div>
                  </div>
                  <div class="alias-actions">
                    <button class="btn btn-secondary btn-sm" *ngIf="!item.isEditing" (click)="startEditAlias(item)">
                      Edit Alias
                    </button>
                    <div class="edit-btn-group" *ngIf="item.isEditing">
                      <button class="btn btn-primary btn-sm" (click)="saveRoomAlias(item)" [disabled]="item.loading">
                        Save
                      </button>
                      <button class="btn btn-ghost btn-sm" (click)="cancelEditAlias(item)" [disabled]="item.loading">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .settings-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 900px) {
      .settings-grid { grid-template-columns: 1fr; }
    }

    .settings-card {
      background: var(--surface);
      border: 1px solid var(--border);
    }
    html[data-theme='dark'] .settings-card {
      background: rgba(15, 17, 26, 0.65);
      backdrop-filter: blur(12px);
    }
    .settings-card h2 { font-size: 20px; font-family: var(--font-display-alt); margin-bottom: 2px; }
    .card-subtitle { font-size: 13.5px; color: var(--text-muted); }

    /* Profile picture styling */
    .profile-avatar-section {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 16px;
      border-radius: var(--radius-md);
      background: var(--surface-alt);
      border: 1px solid var(--border);
    }
    html[data-theme='dark'] .profile-avatar-section {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.03);
    }
    .avatar-preview-container {
      position: relative;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      overflow: hidden;
      cursor: pointer;
    }
    .avatar-btn-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .avatar-preview {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--border);
      background-repeat: no-repeat;
    }
    html[data-theme='dark'] .avatar-preview {
      border: 2px solid rgba(255, 255, 255, 0.1);
    }
    .avatar-preview .initials {
      font-size: 22px;
      font-weight: 700;
      color: #fff;
    }
    .avatar-upload-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .avatar-preview-container:hover .avatar-upload-overlay {
      opacity: 1;
    }
    .avatar-upload-overlay svg {
      width: 24px;
      height: 24px;
      fill: none;
      stroke: #fff;
      stroke-width: 2;
    }
    .avatar-info h3 { font-size: 15px; margin-bottom: 4px; }

    /* Color Swatches */
    .color-palette {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 6px;
    }
    .color-swatch {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .color-swatch:hover { transform: scale(1.1); }
    .color-swatch.selected {
      border-color: #fff;
      transform: scale(1.08);
      box-shadow: 0 0 10px var(--violet);
    }

    /* Aliases list */
    .aliases-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .alias-item {
      background: var(--surface-alt);
      border: 1px solid var(--border);
      padding: 14px 18px;
    }
    html[data-theme='dark'] .alias-item {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.04);
    }
    .alias-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .alias-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }
    .room-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--violet);
    }
    .alias-tag-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .avatar-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .alias-name {
      font-size: 13.5px;
      color: var(--text);
    }
    .form-input-sm {
      padding: 6px 10px;
      font-size: 13px;
      max-width: 220px;
      height: auto;
    }
    .edit-btn-group {
      display: flex;
      gap: 8px;
    }

    /* Lightbox modal styles */
    .lightbox-overlay {
      position: fixed;
      inset: 0;
      background: rgba(4, 5, 10, 0.94);
      backdrop-filter: blur(16px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      animation: fadeIn 0.2s ease;
    }
    .lightbox-content {
      position: relative;
      max-width: 500px;
      width: 100%;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .lightbox-close {
      position: absolute;
      top: -48px;
      right: 0;
      background: none;
      border: none;
      color: #fff;
      font-size: 36px;
      cursor: pointer;
      line-height: 1;
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    .lightbox-close:hover { opacity: 1; }
    .lightbox-img {
      width: 280px;
      height: 280px;
      border-radius: 50%;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
      border: 3px solid rgba(255,255,255,0.15);
      display: block;
    }
    .lightbox-caption {
      font-family: var(--font-mono);
      font-size: 13.5px;
      color: var(--violet);
      text-shadow: 0 0 8px rgba(0, 242, 254, 0.5);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
})
export class SettingsComponent implements OnInit {
  auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private chatService = inject(ChatService);
  private toast = inject(ToastService);

  colors = ['#FFFFFF', '#6C5CE7', '#00B8A9', '#FF6B5B', '#FFC857', '#2EC4B6', '#F94892', '#4361EE'];

  profileName = '';
  selectedColor = '';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  uploadingAvatar = signal(false);
  previewOpen = signal(false);
  savingProfile = signal(false);
  savingPassword = signal(false);
  loadingAliases = signal(false);

  aliases = signal<RoomAliasItem[]>([]);

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.profileName = user.name;
      this.selectedColor = user.avatarColor || '';
    }
    this.loadAliases();
  }

  loadAliases() {
    this.loadingAliases.set(true);
    this.chatService.listMyAliases().subscribe({
      next: (res) => {
        this.aliases.set(res.map((item: any) => ({
          ...item,
          isEditing: false,
          editValue: item.alias,
          loading: false
        })));
        this.loadingAliases.set(false);
      },
      error: () => {
        this.toast.error('Failed to load room identities.');
        this.loadingAliases.set(false);
      }
    });
  }

  getAvatarUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = environment.apiUrl.replace('/api', '');
    return `${apiBase}${path}`;
  }

  initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadingAvatar.set(true);
    const formData = new FormData();
    formData.append('avatar', file);

    this.profileService.uploadAvatar(formData).subscribe({
      next: (res) => {
        this.auth.updateLocalUser(res.user);
        this.toast.success('Profile picture updated successfully!');
        this.uploadingAvatar.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to upload display photo.');
        this.uploadingAvatar.set(false);
      }
    });
  }

  saveProfile() {
    this.savingProfile.set(true);
    const payload = {
      name: this.profileName,
      avatarColor: this.selectedColor,
    };

    this.profileService.updateProfile(payload).subscribe({
      next: (res) => {
        this.auth.updateLocalUser(res.user);
        this.toast.success('Profile settings updated successfully!');
        this.savingProfile.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update profile settings.');
        this.savingProfile.set(false);
      }
    });
  }

  changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.toast.error('New passwords do not match.');
      return;
    }

    this.savingPassword.set(true);
    this.profileService.updatePassword({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.toast.success('Password changed successfully.');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.savingPassword.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update password.');
        this.savingPassword.set(false);
      }
    });
  }

  startEditAlias(item: RoomAliasItem) {
    item.isEditing = true;
    item.editValue = item.alias;
  }

  cancelEditAlias(item: RoomAliasItem) {
    item.isEditing = false;
  }

  saveRoomAlias(item: RoomAliasItem) {
    if (!item.editValue || !item.editValue.trim()) {
      this.toast.error('Alias cannot be empty.');
      return;
    }

    item.loading = true;
    this.chatService.updateRoomAlias(item.roomId._id, item.editValue).subscribe({
      next: (res) => {
        item.alias = res.alias;
        item.isEditing = false;
        item.loading = false;
        this.toast.success(`Identity updated for room #${item.roomId.name}`);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update identity.');
        item.loading = false;
      }
    });
  }
}
