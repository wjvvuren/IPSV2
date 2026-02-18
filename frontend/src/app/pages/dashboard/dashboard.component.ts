import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { ApiLoggerService } from '../../core/services/api-logger.service';
import { ApiResponse } from '../../core/models/api-response.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  healthStatus = signal<string>('Checking...');
  apiCallCount = signal<number>(0);

  constructor(
    private apiService: ApiService,
    private apiLogger: ApiLoggerService
  ) {}

  ngOnInit(): void {
    this.checkHealth();
  }

  checkHealth(): void {
    this.healthStatus.set('Checking...');
    this.apiService.get<ApiResponse<{ status: string }>>('/health').subscribe({
      next: (response) => {
        this.healthStatus.set(response.data?.status ?? 'unknown');
        this.apiCallCount.set(this.apiLogger.count());
      },
      error: () => {
        this.healthStatus.set('unreachable');
        this.apiCallCount.set(this.apiLogger.count());
      }
    });
  }
}
