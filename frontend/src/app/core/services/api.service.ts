import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiLoggerService } from './api-logger.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private logger: ApiLoggerService
  ) {}

  get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = performance.now();
    const logId = this.logger.logRequest('GET', url);

    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        httpParams = httpParams.set(key, String(value));
      });
    }

    return this.http.get<T>(url, { params: httpParams }).pipe(
      tap(response => {
        this.logger.logResponse(logId, 200, response, performance.now() - startTime);
      }),
      catchError(error => {
        this.logger.logError(logId, error.status, error.message, performance.now() - startTime);
        return throwError(() => error);
      })
    );
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = performance.now();
    const logId = this.logger.logRequest('POST', url, body);

    return this.http.post<T>(url, body).pipe(
      tap(response => {
        this.logger.logResponse(logId, 200, response, performance.now() - startTime);
      }),
      catchError(error => {
        this.logger.logError(logId, error.status, error.message, performance.now() - startTime);
        return throwError(() => error);
      })
    );
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = performance.now();
    const logId = this.logger.logRequest('PUT', url, body);

    return this.http.put<T>(url, body).pipe(
      tap(response => {
        this.logger.logResponse(logId, 200, response, performance.now() - startTime);
      }),
      catchError(error => {
        this.logger.logError(logId, error.status, error.message, performance.now() - startTime);
        return throwError(() => error);
      })
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = performance.now();
    const logId = this.logger.logRequest('DELETE', url);

    return this.http.delete<T>(url).pipe(
      tap(response => {
        this.logger.logResponse(logId, 200, response, performance.now() - startTime);
      }),
      catchError(error => {
        this.logger.logError(logId, error.status, error.message, performance.now() - startTime);
        return throwError(() => error);
      })
    );
  }
}
