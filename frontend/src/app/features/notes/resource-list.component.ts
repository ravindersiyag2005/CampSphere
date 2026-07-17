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
          <div class="eyebrow">{{ isPyq ? '📝 PYQ Bank' : '📚 Notes Sharing' }}</div>
          <h1>{{ isPyq ? 'Previous Year Question Papers' : 'Subject Notes' }}</h1>
          <p class="text-muted">{{ isPyq ? 'Search by subject to find past exam papers your seniors uploaded.' : 'Upload and discover notes, upvoted by your batch.' }}</p>
        </div>
        <button class="btn btn-primary" (click)="showUpload.set(!showUpload())">
          {{ showUpload() ? 'Close' : '+ Upload ' + (isPyq ? 'PYQ' : 'Notes') }}
        </button>
      </div>

      <div class="card mt-16" *ngIf="showUpload()">
        <h3>{{ isPyq ? 'Upload a previous year paper' : 'Upload notes' }}</h3>
        <form (ngSubmit)="submitUpload()" #f="ngForm" class="upload-grid">
          <div class="field">
            <label>Title</label>
            <input class="input" name="title" [(ngModel)]="form.title" required placeholder="e.g. Unit 3 – Graph Theory" />
          </div>
          <div class="field">
            <label>Subject</label>
            <input class="input" name="subject" [(ngModel)]="form.subject" required placeholder="e.g. Data Structures" list="subject-list" />
            <datalist id="subject-list">
              <option *ngFor="let s of subjects()" [value]="s"></option>
            </datalist>
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
          <div class="field">
            <label>File (PDF/image)</label>
            <input class="input" type="file" (change)="onFile($event)" accept=".pdf,.png,.jpg,.jpeg,.webp" required />
          </div>
          <button class="btn btn-coral" type="submit" [disabled]="uploading() || f.invalid || !selectedFile">
            <span class="spinner" *ngIf="uploading()"></span>
            {{ uploading() ? 'Uploading…' : 'Upload' }}
          </button>
        </form>
      </div>

      <div class="filters mt-24">
        <input class="input filter-input" [(ngModel)]="search" (ngModelChange)="load()" placeholder="Search by subject or title…" />
        <select class="select filter-select" [(ngModel)]="semester" (ngModelChange)="load()">
          <option value="">All semesters</option>
          <option *ngFor="let s of ['1','2','3','4','5','6','7','8']" [value]="s">Semester {{ s }}</option>
        </select>
      </div>

      <div class="grid grid-cols-3 mt-16" appStaggerIn *ngIf="!loading(); else loadingTpl">
        <div class="card card-hover" [class]="'card-accent-' + (isPyq ? 'coral' : 'violet')" *ngFor="let r of resources()">
          <div class="flex justify-between items-center">
            <span class="badge" [class]="isPyq ? 'badge-coral' : 'badge-violet'">{{ r.subject }}</span>
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
            <a class="btn btn-primary btn-sm" [href]="downloadUrl(r)" target="_blank" rel="noopener">
              ⬇ {{ r.downloadCount }}
            </a>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading() && resources().length === 0">
        <span class="emoji">{{ isPyq ? '📭' : '🗒️' }}</span>
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
  selectedFile: File | null = null;

  form = { title: '', subject: '', semester: '', examType: 'end-sem', year: null as number | null, tags: '' };

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
    this.resourceService
      .list({ type: this.isPyq ? 'pyq' : 'notes', semester: this.semester, search: this.search })
      .subscribe({
        next: (data) => { this.resources.set(data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  submitUpload() {
    if (!this.selectedFile) return;
    const fd = new FormData();
    fd.append('title', this.form.title);
    fd.append('subject', this.form.subject);
    fd.append('semester', this.form.semester);
    fd.append('type', this.isPyq ? 'pyq' : 'notes');
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
        this.form = { title: '', subject: '', semester: '', examType: 'end-sem', year: null, tags: '' };
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
    return this.resourceService.downloadUrl(r._id);
  }

  initials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
