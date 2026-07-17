import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;

  constructor(private auth: AuthService) {}

  connect(): Socket {
    if (this.socket?.connected) return this.socket;
    this.socket = io(environment.socketUrl, {
      auth: { token: this.auth.token },
      transports: ['websocket', 'polling'],
    });
    return this.socket;
  }

  get instance(): Socket {
    return this.socket ?? this.connect();
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
