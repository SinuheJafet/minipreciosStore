import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';

export interface HubMessage<T = unknown> {
  event: string;
  payload: T;
}

/**
 * Generic SignalR service.
 *
 * Usage:
 *   // Subscribe to any event from the hub
 *   realtimeSvc.on<Product>('ProductUpdated').subscribe(p => ...);
 *   realtimeSvc.on<AdminOrder>('OrderStatusChanged').subscribe(o => ...);
 *
 *   // Send a message to the hub (optional, for client-initiated calls)
 *   realtimeSvc.invoke('JoinGroup', 'admins');
 *
 * Supported hub events (see SIGNALR_HUB_PROMPT.md for backend contract):
 *   ProductUpdated   → { id, name, price, stock, ... }
 *   ProductCreated   → { id, name, price, stock, ... }
 *   ProductDeleted   → { id }
 *   OrderStatusChanged → { id, status, trackingNumber? }
 *   InventoryChanged → { productId, stock }
 *   BannerUpdated    → { id, ... }
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private connection: signalR.HubConnection;
  private messages$ = new Subject<HubMessage>();

  /** Reflects the current connection state */
  get state(): signalR.HubConnectionState {
    return this.connection.state;
  }

  constructor() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl, {
        // If the user is logged in, the auth interceptor won't run for SignalR.
        // The token is read from localStorage so the hub can authorize connections.
        accessTokenFactory: () => localStorage.getItem('mp_token') ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(
        environment.production
          ? signalR.LogLevel.Warning
          : signalR.LogLevel.Information,
      )
      .build();

    this.registerWildcardHandler();
    this.start();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Returns an Observable that emits every time the given hub event fires.
   * Type parameter T is the payload shape.
   */
  on<T = unknown>(event: string): Observable<T> {
    return this.messages$.pipe(
      filter(m => m.event === event),
      map(m => m.payload as T),
    );
  }

  /**
   * Invoke a server-side hub method (fire-and-forget).
   * Resolves when the invocation is acknowledged by the server.
   */
  invoke(method: string, ...args: unknown[]): Promise<void> {
    if (this.connection.state !== signalR.HubConnectionState.Connected) {
      return Promise.resolve();
    }
    return this.connection.invoke(method, ...args).catch(err => {
      console.error(`[SignalR] invoke(${method}) error`, err);
    });
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  /**
   * Register a single wildcard-style listener that routes every hub event
   * through the internal Subject, so consumers only subscribe to on().
   *
   * All hub methods that the backend sends must be listed here.
   * Add a new entry whenever a new server-push event is added.
   */
  private registerWildcardHandler(): void {
    const events = [
      'ProductCreated',
      'ProductUpdated',
      'ProductDeleted',
      'OrderCreated',
      'OrderStatusChanged',
      'InventoryChanged',
      'BannerUpdated',
    ];

    for (const event of events) {
      this.connection.on(event, (payload: unknown) => {
        this.messages$.next({ event, payload });
      });
    }
  }

  private start(): void {
    this.connection
      .start()
      .then(() => console.log('[SignalR] connected to', environment.hubUrl))
      .catch(err => console.warn('[SignalR] start error, will retry:', err));
  }

  ngOnDestroy(): void {
    this.connection.stop();
    this.messages$.complete();
  }
}
