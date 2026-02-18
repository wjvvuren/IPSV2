import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ApiResponse } from '../../core/models/api-response.model';

export interface ErmResult {
  columns: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  formId: number;
  procedureName: string;
}

@Component({
  selector: 'app-erm',
  standalone: true,
  imports: [],
  templateUrl: './erm.component.html',
  styleUrl: './erm.component.scss'
})
export class ErmComponent implements OnInit {
  ermData = signal<ErmResult | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  formId = signal<number>(3002443);

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(50);

  totalPages = computed(() => {
    const data = this.ermData();
    if (!data) return 0;
    return Math.ceil(data.totalRows / this.pageSize());
  });

  paginatedRows = computed(() => {
    const data = this.ermData();
    if (!data) return [];
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return data.rows.slice(start, end);
  });

  showingRange = computed(() => {
    const data = this.ermData();
    if (!data || data.totalRows === 0) return '';
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), data.totalRows);
    return `Showing ${start}-${end} of ${data.totalRows}`;
  });

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['formId']);
      if (!isNaN(id) && id > 0) {
        this.formId.set(id);
        this.currentPage.set(1);
        this.loadErm();
      }
    });
  }

  loadErm(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .get<ApiResponse<ErmResult>>('/api/erm', { formId: this.formId() })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.ermData.set(response.data);
          } else {
            this.error.set(response.error ?? 'Unknown error');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message ?? 'Failed to load ERM data');
          this.loading.set(false);
        }
      });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }
}
