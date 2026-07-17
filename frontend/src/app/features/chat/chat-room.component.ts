import { Component, OnInit, OnDestroy, ElementRef, ViewChild, signal, AfterViewChecked, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { SocketService } from '../../core/services/socket.service';
import { ToastService } from '../../core/services/toast.service';
import { AnimationService } from '../../core/services/animation.service';

interface ChatMsg {
  _id: string;
  senderAlias: string;
  text: string;
  createdAt: string;
  mine: boolean;
  avatarColor?: string;
}

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="chat-page">
      <canvas class="rain-canvas" #rainCanvas></canvas>

      <div class="chat-header">
        <div class="term-dots"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span></div>
        <div class="header-left">
          <a routerLink="/chat" class="back-link">← rooms</a>
          <span class="path-sep">/</span>
          <div class="room-info" *ngIf="roomName()">
            <span class="room-name">{{ roomName() }}</span>
            <span class="room-subject" *ngIf="roomSubject()">{{ roomSubject() }}</span>
          </div>
        </div>
        <div class="who-am-i" *ngIf="myAlias()">
          logged in as <span class="alias-chip">{{ myAlias() }}</span>
        </div>
      </div>

      <div class="messages" #scrollBox>
        <div class="empty-state" *ngIf="messages().length === 0">
          <span class="emoji">👋</span>
          <p class="boot-text">$ waiting for first transmission… nobody will know it's you.<span class="term-cursor"></span></p>
        </div>

        <div class="msg-row" [class.mine]="m.mine" *ngFor="let m of messages()">
          <div class="avatar avatar-sm" [style.background]="colorFor(m.senderAlias)" *ngIf="!m.mine">
            {{ m.senderAlias[0] }}
          </div>
          <div class="bubble">
            <div class="bubble-head" *ngIf="!m.mine">
              <span class="prompt-sign">$</span>
              <span class="alias" [style.color]="colorFor(m.senderAlias)">{{ m.senderAlias }}</span>
              <button class="link-btn" (click)="messagePrivately(m.senderAlias)">msg --private</button>
              <button class="link-btn danger" (click)="report(m)">report()</button>
            </div>
            <div class="bubble-text"><span class="prompt-sign mine-prompt" *ngIf="m.mine">&gt;</span>{{ m.text }}</div>
            <div class="bubble-time">{{ m.createdAt | date:'shortTime' }}</div>
          </div>
        </div>
      </div>

      <form class="composer" (ngSubmit)="send()">
        <span class="composer-prompt">{{ myAlias() || 'anon' }}&#64;room:~$</span>
        <input class="input composer-input" [(ngModel)]="draft" name="draft" placeholder="type a message…" autocomplete="off" />
        <button class="btn btn-primary" type="submit" [disabled]="!draft.trim()">Send ↵</button>
      </form>
    </div>
  `,
  styles: [`
    .chat-page { position: relative; display: flex; flex-direction: column; height: 100vh; background: #05060a; overflow: hidden; }

    .rain-canvas { position: absolute; inset: 0; z-index: 0; opacity: 0.18; pointer-events: none; }

    .chat-header {
      position: relative; z-index: 1;
      display: flex; align-items: center; gap: 14px;
      padding: 14px 24px; border-bottom: 1px solid rgba(0,242,254,0.15);
      background: rgba(6, 7, 13, 0.9); backdrop-filter: blur(10px);
      font-family: var(--font-mono); font-size: 13px;
    }
    .term-dots { display: flex; gap: 5px; }
    .term-dots .dot { width: 9px; height: 9px; border-radius: 50%; }
    .dot.r { background: #ff5f57; } .dot.y { background: #febc2e; } .dot.g { background: #28c840; }
    .header-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
    .back-link { font-weight: 600; color: var(--violet); white-space: nowrap; }
    .path-sep { color: var(--text-faint); }
    .room-info { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .room-name { color: #e2e8f0; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 0 8px rgba(0,242,254,0.3); }
    .room-subject { font-size: 11px; color: var(--violet); background: rgba(0,242,254,0.1); border: 1px solid rgba(0,242,254,0.25); padding: 2px 9px; border-radius: var(--radius-pill); white-space: nowrap; }
    .who-am-i { margin-left: auto; font-size: 12.5px; color: var(--text-muted); white-space: nowrap; }
    .alias-chip { background: rgba(0,242,254,0.12); color: var(--violet); padding: 2px 10px; border-radius: var(--radius-pill); font-weight: 700; border: 1px solid rgba(0,242,254,0.3); }

    .messages { position: relative; z-index: 1; flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
    .boot-text { font-family: var(--font-mono); color: var(--violet); }

    .msg-row { display: flex; gap: 10px; max-width: 70%; }
    .msg-row.mine { align-self: flex-end; flex-direction: row-reverse; }

    .bubble {
      background: rgba(15, 17, 26, 0.82);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(0,242,254,0.15);
      border-radius: var(--radius-md);
      padding: 10px 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      font-family: var(--font-mono);
    }
    .msg-row.mine .bubble { background: linear-gradient(135deg, rgba(0,242,254,0.22), rgba(0,184,255,0.16)); border-color: rgba(0,242,254,0.4); color: #eafffe; }
    .bubble-head { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
    .prompt-sign { color: var(--violet); font-weight: 700; }
    .mine-prompt { margin-right: 6px; }
    .alias { font-size: 12.5px; font-weight: 700; }
    .link-btn { background: none; border: none; color: var(--text-faint); font-size: 10.5px; cursor: pointer; padding: 0; font-family: var(--font-mono); }
    .link-btn:hover { color: var(--violet); text-decoration: underline; }
    .link-btn.danger:hover { color: var(--coral); }
    .bubble-text { font-size: 14px; line-height: 1.5; word-break: break-word; color: #e2e8f0; }
    .bubble-time { font-size: 10px; opacity: 0.55; margin-top: 4px; text-align: right; }

    .composer {
      position: relative; z-index: 1;
      display: flex; align-items: center; gap: 10px; padding: 14px 24px;
      border-top: 1px solid rgba(0,242,254,0.12); background: rgba(6, 7, 13, 0.9); backdrop-filter: blur(10px);
    }
    .composer-prompt { font-family: var(--font-mono); color: var(--teal); font-size: 13px; white-space: nowrap; text-shadow: 0 0 6px rgba(57,255,20,0.4); }
    .composer-input { flex: 1; font-family: var(--font-mono); background: rgba(15,17,26,0.8); border-color: rgba(0,242,254,0.2); color: #e2e8f0; }
    .composer-input::placeholder { color: rgba(0,242,254,0.35); }
  `],
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit {
  @ViewChild('scrollBox') scrollBox!: ElementRef<HTMLDivElement>;
  @ViewChild('rainCanvas') rainCanvas?: ElementRef<HTMLCanvasElement>;
  private rainFrame: any;

  roomId = '';
  roomName = signal('');
  roomSubject = signal('');
  messages = signal<ChatMsg[]>([]);
  myAlias = signal('');
  private shouldScroll = false;
  private colorMap = new Map<string, string>();
  private palette = ['#00f2fe', '#f35588', '#39ff14', '#ffb800', '#00b8ff', '#ff007f'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chatService: ChatService,
    private socketService: SocketService,
    private toast: ToastService,
    private anim: AnimationService
  ) {}

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';

    this.chatService.getRoom(this.roomId).subscribe((room) => {
      this.roomName.set(room.name);
      this.roomSubject.set(room.subject || '');
    });
    this.chatService.getMyAlias(this.roomId).subscribe((res) => this.myAlias.set(res.alias));
    this.chatService.getRoomMessages(this.roomId).subscribe((data) => {
      this.messages.set(data);
      this.shouldScroll = true;
      queueMicrotask(() => {
        if (this.scrollBox) this.anim.staggerIn(Array.from(this.scrollBox.nativeElement.querySelectorAll('.msg-row')), { y: 10 });
      });
    });

    const socket = this.socketService.connect();
    socket.emit('joinRoom', { roomId: this.roomId });

    socket.on('yourAlias', (data: any) => this.myAlias.set(data.alias));

    socket.on('newMessage', (msg: any) => {
      if (msg.roomId !== this.roomId) return;
      this.messages.update((list) => [
        ...list,
        { _id: msg._id, senderAlias: msg.senderAlias, text: msg.text, createdAt: msg.createdAt, mine: msg.senderAlias === this.myAlias() },
      ]);
      this.shouldScroll = true;
      queueMicrotask(() => {
        if (!this.scrollBox) return;
        const rows = this.scrollBox.nativeElement.querySelectorAll('.msg-row');
        const last = rows[rows.length - 1];
        if (last) this.anim.popIn(last);
      });
    });

    socket.on('errorMessage', (err: any) => this.toast.error(err.message));
  }

  ngAfterViewInit() {
    this.startRain();
  }

  private startRain() {
    const canvas = this.rainCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chars = '01アイウエオカキクケコ$#{}<>/';
    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      columns = Math.floor(canvas.width / 16);
      drops = new Array(columns).fill(0).map(() => Math.floor(Math.random() * -40));
    };
    resize();
    window.addEventListener('resize', resize);
    (this as any)._rainResize = resize;

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 6, 10, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px "JetBrains Mono", monospace';
      for (let i = 0; i < columns; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.94 ? '#eafffe' : 'rgba(0, 242, 254, 0.55)';
        ctx.fillText(char, i * 16, drops[i] * 16);
        if (drops[i] * 16 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      this.rainFrame = requestAnimationFrame(draw);
    };
    draw();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll && this.scrollBox) {
      this.scrollBox.nativeElement.scrollTop = this.scrollBox.nativeElement.scrollHeight;
      this.shouldScroll = false;
    }
  }

  ngOnDestroy() {
    this.socketService.instance.off('newMessage');
    this.socketService.instance.off('yourAlias');
    this.socketService.instance.off('errorMessage');
    if (this.rainFrame) cancelAnimationFrame(this.rainFrame);
    if ((this as any)._rainResize) window.removeEventListener('resize', (this as any)._rainResize);
  }

  draft = '';

  send() {
    if (!this.draft.trim()) return;
    this.socketService.instance.emit('sendMessage', { roomId: this.roomId, text: this.draft.trim() });
    this.draft = '';
  }

  messagePrivately(alias: string) {
    this.chatService.startDM(this.roomId, alias).subscribe((res) => {
      this.router.navigate(['/chat/dm', res.conversationId]);
    });
  }

  report(m: ChatMsg) {
    this.chatService.reportMessage(m._id, 'inappropriate').subscribe(() => {
      this.toast.success('Message reported to admins.');
    });
  }

  colorFor(alias: string): string {
    if (!this.colorMap.has(alias)) {
      this.colorMap.set(alias, this.palette[this.colorMap.size % this.palette.length]);
    }
    return this.colorMap.get(alias)!;
  }
}
