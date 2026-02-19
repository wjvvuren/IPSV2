import { Component, computed, input, output } from '@angular/core';

export interface DataGridConfig {
  columns: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  pageSize?: number;
}

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.scss'
})
export class DataGridComponent {
  /** Column names to render */
  columns = input.required<string[]>();

  /** Row data for the current view */
  rows = input.required<Record<string, unknown>[]>();

  /** Total row count (for pagination display) */
  totalRows = input<number>(0);

  /** Current page (1-based) */
  currentPage = input<number>(1);

  /** Rows per page */
  pageSize = input<number>(50);

  /** Whether the parent is loading data */
  loading = input<boolean>(false);

  /** Emits requested page number */
  pageChange = output<number>();

  totalPages = computed(() => {
    const total = this.totalRows();
    const size = this.pageSize();
    return size > 0 ? Math.ceil(total / size) : 0;
  });

  showingRange = computed(() => {
    const total = this.totalRows();
    if (total === 0) return '';
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size + 1;
    const end = Math.min(page * size, total);
    return `Showing ${start}–${end} of ${total}`;
  });

  prevPage(): void {
    const page = this.currentPage();
    if (page > 1) {
      this.pageChange.emit(page - 1);
    }
  }

  nextPage(): void {
    const page = this.currentPage();
    if (page < this.totalPages()) {
      this.pageChange.emit(page + 1);
    }
  }
}
