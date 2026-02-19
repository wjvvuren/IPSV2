import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ApiResponse } from '../../core/models/api-response.model';
import { DataGridComponent } from '../../shared/components/data-grid/data-grid.component';

/** Generic result shape returned by stored-procedure-backed endpoints */
export interface FormResult {
  columns: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  formId: number;
  procedureName: string;
}

/**
 * FormViewComponent — THE single dynamic form page.
 *
 * Reads `formId` from the route, calls the API, and renders
 * a DataGridComponent. All forms (ERM, future parents/children)
 * use this same component — no per-form components allowed.
 */
@Component({
  selector: 'app-form-view',
  standalone: true,
  imports: [DataGridComponent],
  templateUrl: './form-view.component.html',
  styleUrl: './form-view.component.scss'
})
export class FormViewComponent implements OnInit {
  formData = signal<FormResult | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  formId = signal<number>(0);

  /** Dev-note: FormIDs known to return 500 — Backend Req #002 */
  private readonly failingFormIds = new Set([3000825, 3000275, 3000152, 3000214, 3000908]);
  isKnownFailing = computed(() => this.failingFormIds.has(this.formId()));

  /** Dev-note: FormIDs that currently return 0 rows — Backend Req #002 */
  private readonly emptyFormIds = new Set([
    3003751, 3004196, 3001603, 3003752, 3003754, 3000650,
    3001488, 3003725, 3004095, 3003744, 3003756, 3004120,
    3003745, 3001231
  ]);
  isKnownEmpty = computed(() => this.emptyFormIds.has(this.formId()));

  // ── Pagination (client-side until Backend Req #002 delivers server-side) ──
  currentPage = signal<number>(1);
  pageSize = signal<number>(50);

  paginatedRows = computed(() => {
    const data = this.formData();
    if (!data) return [];
    const start = (this.currentPage() - 1) * this.pageSize();
    return data.rows.slice(start, start + this.pageSize());
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
        this.loadForm();
      }
    });
  }

  loadForm(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .get<ApiResponse<FormResult>>('/api/erm', { formId: this.formId() })
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.formData.set(response.data);
          } else {
            this.error.set(response.error ?? 'Unknown error');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message ?? 'Failed to load form data');
          this.loading.set(false);
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }
}
