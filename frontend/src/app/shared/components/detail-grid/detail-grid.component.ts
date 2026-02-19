import { Component, computed, input, output } from '@angular/core';

/**
 * DetailGridComponent — Generic, stateless detail table.
 *
 * Displays a secondary data grid (e.g. child records, related data).
 * Follows the same pattern as DataGridComponent: receives data via
 * input(), emits events via output(). Never fetches data itself.
 *
 * TODO(backend-004): This component is EMPTY until Theo creates ReadDetailTabs + ReadDetailData.
 * Once those procedures exist, the parent (FormViewComponent) will:
 *   1. Call ReadDetailTabs(FormID) to get available tabs
 *   2. On row select + tab click, call ReadDetailData(DetailFormID, ParentObjNo, page, pageSize)
 *   3. Pass columns/rows into this component
 * See docs/backend-requests/004-detail-child-records.md
 */
@Component({
  selector: 'app-detail-grid',
  standalone: true,
  imports: [],
  templateUrl: './detail-grid.component.html',
  styleUrl: './detail-grid.component.scss'
})
export class DetailGridComponent {
  /** Column names to render */
  columns = input<string[]>([]);

  /** Row data for the current view */
  rows = input<Record<string, unknown>[]>([]);

  /** Total row count (for pagination display) */
  totalRows = input<number>(0);

  /** Current page (1-based) */
  currentPage = input<number>(1);

  /** Rows per page */
  pageSize = input<number>(50);

  /** Whether the parent is loading data */
  loading = input<boolean>(false);

  /** Optional title displayed above the grid */
  title = input<string>('Details');

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
