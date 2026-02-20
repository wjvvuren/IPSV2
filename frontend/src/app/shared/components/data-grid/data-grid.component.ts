import { Component, computed, input, output } from '@angular/core';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';

export interface DataGridConfig {
  columns: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  pageSize?: number;
}

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [TableModule],
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
  pageSize = input<number>(20);

  /** Whether the parent is loading data */
  loading = input<boolean>(false);

  /** Emits requested page number */
  pageChange = output<number>();

  /** Emits when a row is selected */
  rowSelect = output<Record<string, unknown>>();

  /** Currently selected row */
  selectedRow: Record<string, unknown> | null = null;

  /** Compute the PrimeNG "first" offset from page + pageSize */
  first = computed(() => (this.currentPage() - 1) * this.pageSize());

  totalPages = computed(() => {
    const total = this.totalRows();
    const size = this.pageSize();
    return size > 0 ? Math.ceil(total / size) : 0;
  });

  onPageChange(event: TableLazyLoadEvent): void {
    const first = (event.first ?? 0);
    const rows = (event.rows ?? this.pageSize());
    const page = Math.floor(first / rows) + 1;
    this.pageChange.emit(page);
  }

  onRowSelect(row: Record<string, unknown>): void {
    this.selectedRow = row;
    this.rowSelect.emit(row);
  }
}
