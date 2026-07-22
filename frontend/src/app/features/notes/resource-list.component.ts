import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ResourceService } from '../../core/services/resource.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AnimationService } from '../../core/services/animation.service';
import { StaggerInDirective } from '../../shared/components/stagger-in.directive';

@Component({
  selector: 'app-resource-list',
  standalone: true,
  imports: [CommonModule, FormsModule, StaggerInDirective],
  template: `
    <div class="page" [class.page--notes]="!isPyq" [class.page--pyq]="isPyq">
      <div class="page-header">
        <div>
          <div class="eyebrow">{{ isPyq ? 'PYQ Bank' : 'Notes Sharing' }}</div>
          <h1>{{ isPyq ? 'Previous Year Question Papers' : 'Subject Notes' }}</h1>
          <p class="text-muted">{{ isPyq ? 'Search by subject to find past exam papers your seniors uploaded.' : 'Upload and discover notes, upvoted by your batch.' }}</p>
        </div>
        <button class="btn btn-primary" (click)="showUpload.set(!showUpload()); isEditing = false; editId = null;">
          {{ showUpload() ? 'Close' : '+ Upload ' + (isPyq ? 'PYQ' : 'Notes') }}
        </button>
      </div>

      <div class="card mt-16" *ngIf="showUpload()">
        <h3>{{ isEditing ? 'Edit details' : (isPyq ? 'Upload a previous year paper' : 'Upload notes') }}</h3>
        <form (ngSubmit)="submitUpload()" #f="ngForm" class="upload-grid">
          <div class="field">
            <label>Title</label>
            <input class="input" name="title" [(ngModel)]="form.title" required placeholder="e.g. Unit 3 – Graph Theory" />
          </div>
          <div class="field">
            <label>Subject</label>
            <input class="input" name="subject" [(ngModel)]="form.subject" required placeholder="e.g. Data Structures" />
          </div>
          <div class="field">
            <label>Semester</label>
            <input class="input" name="semester" [(ngModel)]="form.semester" required placeholder="e.g. 4" />
          </div>
          <div class="field" *ngIf="isPyq">
            <label>Exam type</label>
            <select class="select" name="examType" [(ngModel)]="form.examType">
              <option value="mid-sem">Mid Sem</option>
              <option value="end-sem">End Sem</option>
              <option value="quiz">Quiz</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="field" *ngIf="isPyq">
            <label>Year</label>
            <input class="input" type="number" name="year" [(ngModel)]="form.year" placeholder="e.g. 2024" />
          </div>
          <div class="field">
            <label>Tags (comma separated)</label>
            <input class="input" name="tags" [(ngModel)]="form.tags" placeholder="important, diagrams, solved" />
          </div>
          <div class="field" *ngIf="!isPyq">
            <label>Privacy</label>
            <div class="flex gap-16" style="margin-top: 8px;">
              <label class="flex items-center gap-8 cursor-pointer">
                <input type="radio" name="privacy" [value]="false" [(ngModel)]="form.isPrivate" /> Public
              </label>
              <label class="flex items-center gap-8 cursor-pointer">
                <input type="radio" name="privacy" [value]="true" [(ngModel)]="form.isPrivate" /> Private
              </label>
            </div>
          </div>
          <div class="field" *ngIf="form.isPrivate && !isPyq" style="position: relative;">
            <label>Share with (College IDs)</label>
            <div class="flex gap-8 mb-8" style="flex-wrap: wrap;" *ngIf="form.sharedWith.length > 0">
              <span class="badge badge-coral flex items-center gap-4" *ngFor="let id of form.sharedWith">
                {{ id }} <span class="cursor-pointer" style="padding-left: 4px;" (click)="removeSharedUser(id)">✕</span>
              </span>
            </div>
            <div class="flex gap-8">
              <input class="input" name="searchQuery" [(ngModel)]="searchQuery" (keyup)="onSearch()" (keydown.enter)="addManualUser($event)" placeholder="Search or enter ID..." autocomplete="off" />
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
          <div class="field" *ngIf="!isEditing">
            <label>File (PDF/image)</label>
            <input class="input" type="file" (change)="onFile($event)" accept=".pdf,.png,.jpg,.jpeg,.webp" required />
          </div>
          <div class="flex gap-8 items-end">
            <button *ngIf="isEditing" type="button" class="btn btn-ghost" (click)="cancelEdit()">Cancel</button>
            <button class="btn btn-coral" type="submit" [disabled]="uploading() || f.invalid || (!isEditing && !selectedFile)">
              <span class="spinner" *ngIf="uploading()"></span>
              {{ uploading() ? 'Saving…' : (isEditing ? 'Save Changes' : 'Upload') }}
            </button>
          </div>
        </form>
      </div>

      <div class="filters mt-24">
        <input class="input filter-input" [(ngModel)]="search" (ngModelChange)="load()" placeholder="Search by subject or title…" />
        <select class="select filter-select" [(ngModel)]="semester" (ngModelChange)="load()">
          <option value="">All semesters</option>
          <option *ngFor="let s of ['1','2','3','4','5','6','7','8']" [value]="s">Semester {{ s }}</option>
        </select>
        <button class="btn filter-select" [class.btn-primary]="myPrivateFilter" [class.btn-ghost]="!myPrivateFilter" *ngIf="!isPyq" (click)="myPrivateFilter = !myPrivateFilter; load()">My Private Notes</button>
      </div>

      <div class="grid grid-cols-3 mt-16" appStaggerIn *ngIf="!loading(); else loadingTpl">
        <div class="card card-hover" [class]="'card-accent-' + (isPyq ? 'coral' : 'violet')" *ngFor="let r of resources()">
          <div class="flex justify-between items-center">
            <span class="badge" [class]="isPyq ? 'badge-coral' : 'badge-violet'">
              <span *ngIf="r.isPrivate" title="Private Note">🔒 </span>{{ r.subject }}
            </span>
            <span class="badge badge-muted">Sem {{ r.semester }}</span>
          </div>
          <h3 class="mt-8">{{ r.title }}</h3>
          <div class="tag" *ngIf="r.examType">{{ r.examType }}</div>
          <div class="tag" *ngIf="r.year">{{ r.year }}</div>
          <div class="tag" *ngFor="let t of r.tags">#{{ t }}</div>

          <div class="flex items-center gap-8 mt-16">
            <div class="avatar avatar-sm" [style.background]="r.uploadedBy?.avatarColor || '#6C5CE7'">
              {{ initials(r.uploadedBy?.name) }}
            </div>
            <span class="text-sm text-muted">{{ r.uploadedBy?.name || 'Unknown' }}</span>
          </div>

          <div class="flex justify-between items-center mt-16">
            <button class="btn btn-ghost btn-sm" (click)="upvote(r, $event)">
              ▲ {{ r.upvotes.length }}
            </button>
            <div class="flex gap-8">
              <button class="btn btn-ghost btn-sm text-muted" *ngIf="canEdit(r)" (click)="edit(r)">Edit</button>
              <button class="btn btn-ghost btn-sm" style="color: #FF6B5B" *ngIf="canEdit(r)" (click)="deleteResource(r)">Delete</button>
              <a class="btn btn-primary btn-sm" [href]="downloadUrl(r)" target="_blank" rel="noopener">
                ⬇ {{ r.downloadCount }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading() && resources().length === 0">
        <svg class="empty-state-icon" viewBox="0 0 24 24" *ngIf="isPyq"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <svg class="empty-state-icon" viewBox="0 0 24 24" *ngIf="!isPyq"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p>No {{ isPyq ? 'papers' : 'notes' }} yet — be the first to upload one!</p>
      </div>

      <ng-template #loadingTpl>
        <div class="grid grid-cols-3 mt-16">
          <div class="skeleton" style="height: 190px" *ngFor="let i of [1,2,3,4,5,6]"></div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .upload-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; align-items: end; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; }
    .filter-input { flex: 2; min-width: 220px; }
    .filter-select { flex: 1; min-width: 160px; }
    .dropdown-menu { position: absolute; top: 100%; left: 0; right: 0; background: var(--surface); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; z-index: 10; max-height: 200px; overflow-y: auto; padding: 8px 0; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
    .dropdown-item { padding: 8px 16px; cursor: pointer; transition: background 0.2s; }
    .dropdown-item:hover { background: rgba(255,255,255,0.05); }
    @media (max-width: 768px) {
      .upload-grid { grid-template-columns: 1fr; gap: 12px; }
      .page-header .btn { width: 100%; margin-top: 12px; }
      .filters { flex-direction: column; }
      .filter-input, .filter-select { width: 100%; min-width: auto; }
    }
  `],
})
export class ResourceListComponent implements OnInit {
  isPyq = false;
  resources = signal<any[]>([]);
  subjects = signal<string[]>([]);
  loading = signal(true);
  uploading = signal(false);
  showUpload = signal(false);

  search = '';
  semester = '';
  myPrivateFilter = false;
  selectedFile: File | null = null;
  
  isEditing = false;
  editId: string | null = null;

  form = { title: '', subject: '', semester: '', examType: 'end-sem', year: null as number | null, tags: '', isPrivate: false, sharedWith: [] as string[] };

  searchQuery = '';
  searchResults = signal<any[]>([]);
  showDropdown = false;
  searchTimeout: any;

  constructor(
    private route: ActivatedRoute,
    private resourceService: ResourceService,
    public auth: AuthService,
    private toast: ToastService,
    private anim: AnimationService
  ) {}

  ngOnInit() {
    this.isPyq = this.route.snapshot.data['resourceType'] === 'pyq';
    this.resourceService.subjects().subscribe((s) => this.subjects.set(s));
    this.load();
  }

  load() {
    this.loading.set(true);
    let params: any = { type: this.isPyq ? 'pyq' : 'notes', semester: this.semester, search: this.search };
    if (this.myPrivateFilter) params.myPrivate = 'true';
    this.resourceService
      .list(params)
      .subscribe({
        next: (data) => { this.resources.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    if (!this.searchQuery.trim()) {
      this.searchResults.set([]);
      this.showDropdown = false;
      return;
    }
    this.searchTimeout = setTimeout(() => {
      this.auth.searchUsers(this.searchQuery).subscribe((res) => {
        this.searchResults.set(res);
        this.showDropdown = true;
      });
    }, 300);
  }

  selectUser(user: any) {
    if (!this.form.sharedWith.includes(user.collegeId)) {
      this.form.sharedWith.push(user.collegeId);
    }
    this.searchQuery = '';
    this.showDropdown = false;
  }

  addManualUser(event: Event) {
    event.preventDefault();
    if (this.searchQuery.trim() && !this.form.sharedWith.includes(this.searchQuery.trim())) {
      this.form.sharedWith.push(this.searchQuery.trim());
    }
    this.searchQuery = '';
    this.showDropdown = false;
  }

  removeSharedUser(id: string) {
    this.form.sharedWith = this.form.sharedWith.filter(u => u !== id);
  }

  submitUpload() {
    if (this.isEditing && this.editId) {
      this.uploading.set(true);
      const data = { ...this.form, type: this.isPyq ? 'pyq' : 'notes' };
      this.resourceService.update(this.editId, data).subscribe({
        next: () => {
          this.uploading.set(false);
          this.toast.success('Details updated successfully');
          this.cancelEdit();
          this.load();
        },
        error: () => this.uploading.set(false),
      });
      return;
    }

    if (!this.selectedFile) return;
    const fd = new FormData();
    fd.append('title', this.form.title);
    fd.append('subject', this.form.subject);
    fd.append('semester', this.form.semester);
    fd.append('type', this.isPyq ? 'pyq' : 'notes');
    if (!this.isPyq) {
      fd.append('isPrivate', String(this.form.isPrivate));
      if (this.form.isPrivate) {
        fd.append('sharedWith', this.form.sharedWith.join(','));
      }
    }
    if (this.isPyq) {
      fd.append('examType', this.form.examType);
      if (this.form.year) fd.append('year', String(this.form.year));
    }
    fd.append('tags', this.form.tags);
    fd.append('file', this.selectedFile);

    this.uploading.set(true);
    this.resourceService.upload(fd).subscribe({
      next: () => {
        this.uploading.set(false);
        this.showUpload.set(false);
        this.toast.success(`${this.isPyq ? 'Paper' : 'Notes'} uploaded — +5 contribution points!`);
        
        const u = this.auth.currentUser();
        if (u) {
          this.auth.updateLocalUser({ ...u, contributionPoints: (u.contributionPoints || 0) + 5 });
        }

        this.form = { title: '', subject: '', semester: '', examType: 'end-sem', year: null, tags: '', isPrivate: false, sharedWith: [] };
        this.selectedFile = null;
        this.load();
      },
      error: () => this.uploading.set(false),
    });
  }

  upvote(r: any, event: MouseEvent) {
    this.anim.pulse(event.currentTarget as Element);
    this.resourceService.upvote(r._id).subscribe((res) => {
      r.upvotes = new Array(res.upvotes);
    });
  }

  downloadUrl(r: any) {
    const token = this.auth.token;
    return `${this.resourceService.downloadUrl(r._id)}?token=${token}`;
  }

  canEdit(r: any): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    return user.id === r.uploadedBy?._id || user.role === 'admin';
  }

  edit(r: any) {
    this.isEditing = true;
    this.editId = r._id;
    this.form = {
      title: r.title,
      subject: r.subject,
      semester: r.semester,
      examType: r.examType || 'end-sem',
      year: r.year || null,
      tags: r.tags ? r.tags.join(', ') : '',
      isPrivate: r.isPrivate || false,
      sharedWith: r.sharedWith || []
    };
    this.showUpload.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editId = null;
    this.form = { title: '', subject: '', semester: '', examType: 'end-sem', year: null, tags: '', isPrivate: false, sharedWith: [] };
    this.showUpload.set(false);
    this.searchQuery = '';
    this.showDropdown = false;
  }

  deleteResource(r: any) {
    if (!confirm('Are you sure you want to delete this? This cannot be undone.')) return;
    this.resourceService.delete(r._id).subscribe({
      next: () => {
        this.toast.success('Deleted successfully');
        this.load();
      }
    });
  }

  initials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
