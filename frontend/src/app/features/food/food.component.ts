import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodService } from '../../core/services/food.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AnimationService } from '../../core/services/animation.service';
import { StaggerInDirective } from '../../shared/components/stagger-in.directive';

@Component({
  selector: 'app-food',
  standalone: true,
  imports: [CommonModule, FormsModule, StaggerInDirective],
  template: `
    <div class="page page--food">
      <div class="page-header">
        <div>
          <div class="eyebrow">🍜 Food Spots</div>
          <h1>Best bites, on campus and around the city</h1>
          <p class="text-muted">Pin your favourite dish, rate what others recommend.</p>
        </div>
        <button class="btn btn-primary" (click)="showForm.set(!showForm())">
          {{ showForm() ? 'Close' : '+ Add a spot' }}
        </button>
      </div>

      <div class="card mt-16" *ngIf="showForm()">
        <h3>Add a food spot</h3>
        <form (ngSubmit)="submit()" #f="ngForm" class="form-grid">
          <div class="field">
            <label>Place name</label>
            <input class="input" name="name" [(ngModel)]="form.name" required placeholder="e.g. Maggi Point" />
          </div>
          <div class="field">
            <label>Dish</label>
            <input class="input" name="dishName" [(ngModel)]="form.dishName" required placeholder="e.g. Cheese Maggi" />
          </div>
          <div class="field">
            <label>Where</label>
            <select class="select" name="locationType" [(ngModel)]="form.locationType">
              <option value="campus-foodcourt">Campus foodcourt</option>
              <option value="city">City</option>
            </select>
          </div>
          <div class="field">
            <label>Location / area</label>
            <input class="input" name="location" [(ngModel)]="form.location" required placeholder="e.g. Block C Foodcourt / Sector 17" />
          </div>
          <div class="field">
            <label>Price range</label>
            <select class="select" name="priceRange" [(ngModel)]="form.priceRange">
              <option value="₹">₹ Budget</option>
              <option value="₹₹">₹₹ Moderate</option>
              <option value="₹₹₹">₹₹₹ Splurge</option>
            </select>
          </div>
          <div class="field">
            <label>Tags (comma separated)</label>
            <input class="input" name="tags" [(ngModel)]="form.tags" placeholder="spicy, veg, late-night" />
          </div>
          <button class="btn btn-coral" type="submit" [disabled]="saving() || f.invalid">
            <span class="spinner" *ngIf="saving()"></span> {{ saving() ? 'Adding…' : 'Add spot' }}
          </button>
        </form>
      </div>

      <div class="filters mt-24">
        <input class="input filter-input" [(ngModel)]="search" (ngModelChange)="load()" placeholder="Search dish, place, or area…" />
        <select class="select filter-select" [(ngModel)]="locationType" (ngModelChange)="load()">
          <option value="">Campus + City</option>
          <option value="campus-foodcourt">Campus only</option>
          <option value="city">City only</option>
        </select>
      </div>

      <div class="grid grid-cols-3 mt-16" appStaggerIn *ngIf="!loading(); else loadingTpl">
        <div class="card card-hover card-accent-pink" *ngFor="let s of spots()">
          <div class="flex justify-between items-center">
            <span class="badge badge-pink">{{ s.locationType === 'campus-foodcourt' ? 'On campus' : 'City' }}</span>
            <span class="badge badge-amber">{{ s.priceRange }}</span>
          </div>
          <h3 class="mt-8">{{ s.dishName }}</h3>
          <div class="text-sm text-muted">at {{ s.name }} · {{ s.location }}</div>
          <div class="tag" *ngFor="let t of s.tags">#{{ t }}</div>

          <div class="rating-row mt-16">
            <span class="stars">{{ starString(s.avgRating) }}</span>
            <span class="text-sm text-muted">{{ s.avgRating | number:'1.1-1' }} ({{ s.ratingCount }})</span>
          </div>

          <div class="flex justify-between items-center mt-16">
            <button class="btn btn-ghost btn-sm" (click)="upvote(s, $event)">▲ {{ s.upvotes.length }}</button>
            <div class="rate-widget">
              <button class="star-btn" *ngFor="let n of [1,2,3,4,5]" (click)="rate(s, n, $event)">{{ n <= (myRatings[s._id] || 0) ? '★' : '☆' }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading() && spots().length === 0">
        <span class="emoji">🍽️</span>
        <p>No food spots yet — pin your favourite!</p>
      </div>

      <ng-template #loadingTpl>
        <div class="grid grid-cols-3 mt-16">
          <div class="skeleton" style="height: 200px" *ngFor="let i of [1,2,3,4,5,6]"></div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; align-items: end; }
    .filters { display: flex; gap: 12px; flex-wrap: wrap; }
    .filter-input { flex: 2; min-width: 220px; }
    .filter-select { flex: 1; min-width: 180px; }
    .stars { color: var(--amber); letter-spacing: 2px; }
    .rating-row { display: flex; align-items: center; gap: 8px; }
    .rate-widget { display: flex; }
    .star-btn { background: none; border: none; color: var(--amber); font-size: 18px; cursor: pointer; padding: 2px; }
  `],
})
export class FoodComponent implements OnInit {
  spots = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  search = '';
  locationType = '';
  myRatings: Record<string, number> = {};

  form = { name: '', dishName: '', locationType: 'campus-foodcourt', location: '', priceRange: '₹', tags: '' };

  constructor(private foodService: FoodService, public auth: AuthService, private toast: ToastService, private anim: AnimationService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.foodService.list({ locationType: this.locationType, search: this.search }).subscribe({
      next: (data) => { this.spots.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  submit() {
    this.saving.set(true);
    this.foodService.create(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toast.success('Food spot added!');
        this.form = { name: '', dishName: '', locationType: 'campus-foodcourt', location: '', priceRange: '₹', tags: '' };
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  upvote(s: any, event: MouseEvent) {
    this.anim.pulse(event.currentTarget as Element);
    this.foodService.upvote(s._id).subscribe((res) => { s.upvotes = new Array(res.upvotes); });
  }

  rate(s: any, n: number, event: MouseEvent) {
    this.anim.pulse(event.currentTarget as Element);
    this.myRatings[s._id] = n;
    this.foodService.review(s._id, { rating: n, comment: '' }).subscribe((res) => {
      s.avgRating = res.avgRating;
      s.ratingCount = res.ratingCount;
      this.toast.success('Thanks for rating!');
    });
  }

  starString(avg: number): string {
    const full = Math.round(avg || 0);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }
}
