import { Injectable, signal, computed } from '@angular/core';
import { ApiRequestLog } from '../models/api-request-log.model';

@Injectable({ providedIn: 'root' })
export class ApiLoggerService {
  private readonly maxLogs = 50;
  private readonly _logs = signal<ApiRequestLog[]>([]);

  /** All logged API calls (most recent first, max 50). */
  readonly logs = this._logs.asReadonly();

  /** Number of logged calls. */
  readonly count = computed(() => this._logs().length);

  /** Create a new log entry when a request starts. Returns the log ID. */
  logRequest(method: string, url: string, body?: unknown): string {
    const id = crypto.randomUUID();
    const entry: ApiRequestLog = {
      id,
      method,
      url,
      requestBody: body,
      timestamp: new Date()
    };

    this._logs.update(logs => [entry, ...logs].slice(0, this.maxLogs));
    return id;
  }

  /** Update the log entry when the response arrives. */
  logResponse(id: string, statusCode: number, responseBody: unknown, duration: number): void {
    this._logs.update(logs =>
      logs.map(log =>
        log.id === id ? { ...log, statusCode, responseBody, duration } : log
      )
    );
  }

  /** Update the log entry when an error occurs. */
  logError(id: string, statusCode: number, error: string, duration: number): void {
    this._logs.update(logs =>
      logs.map(log =>
        log.id === id ? { ...log, statusCode, error, duration } : log
      )
    );
  }

  /** Clear all logs. */
  clear(): void {
    this._logs.set([]);
  }
}
