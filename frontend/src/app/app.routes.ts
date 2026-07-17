import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'notes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notes/resource-list.component').then((m) => m.ResourceListComponent),
    data: { resourceType: 'notes' },
  },
  {
    path: 'pyq',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notes/resource-list.component').then((m) => m.ResourceListComponent),
    data: { resourceType: 'pyq' },
  },
  {
    path: 'events',
    canActivate: [authGuard],
    loadComponent: () => import('./features/events/events.component').then((m) => m.EventsComponent),
  },
  {
    path: 'food',
    canActivate: [authGuard],
    loadComponent: () => import('./features/food/food.component').then((m) => m.FoodComponent),
  },
  {
    path: 'travel',
    canActivate: [authGuard],
    loadComponent: () => import('./features/travel/travel.component').then((m) => m.TravelComponent),
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chat-rooms.component').then((m) => m.ChatRoomsComponent),
  },
  {
    path: 'chat/dms',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chat-dms-list.component').then((m) => m.ChatDmsListComponent),
  },
  {
    path: 'chat/room/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chat-room.component').then((m) => m.ChatRoomComponent),
  },
  {
    path: 'chat/dm/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chat-dm.component').then((m) => m.ChatDmComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
