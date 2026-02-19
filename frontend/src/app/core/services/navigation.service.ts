import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api-response.model';

/** A top-level module (Strategy, Planning, ERM, etc.) */
export interface NavModule {
  ObjNo: number | string;
  Code: string;
  Name: string;
  Description: string;
  Icon: string;
  SortOrder: number | string;
  StatusNo: number | string;
  IsActive: number | string;
}

/** A child item under a module */
export interface NavChild {
  ObjNo: number | string;
  Code: string;
  Name: string;
  ParentObjNo: number | string;
  ObjTypeNo: number | string;
  SortOrder: number | string;
  StatusNo: number | string;
  FormID: number | string | null;
}

export interface NavigationData {
  modules: NavModule[];
  children: NavChild[];
}

/**
 * Shared navigation service — loads the full nav tree once from ReadNavigation
 * and exposes it to the top navbar + sidebar.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly ERM_OBJ_NO = 3003721;

  /**
   * TODO(backend-003): REMOVE THIS ENTIRE MAP once Theo fixes ReadNavigation's FormID JOIN.
   * The LEFT JOIN on ObjCode + ObjTypeNo=826 returns wrong/duplicate FormIDs.
   * This hardcoded map is a TEMPORARY WORKAROUND — see docs/backend-requests/003-application-navigation.md
   */
  private readonly FORM_ID_OVERRIDES: Record<string, number> = {
    'Stakeholder': 3002443,
    'Product': 3003751,
    'Business Process': 3004196,
    'Resource': 3000825,
    'Look-ups': 3001603,
    'Share Register': 3003754,
    'Related Party': 3003752,
    'Addresses': 3000650,
    'Documents': 3001488,
    'Account': 3000743,
    'AccountSetUp': 3003725,
    'Specific Fees': 3004095,
    'Bank Transaction': 3000152,
    'Journals': 3000214,
    'General Ledgers': 3003744,
    'Sub-Product': 3003756,
    'Sub-Product Detail': 3004120,
    'Global Fees': 3003745,
    'Equipment': 3000908,
    'Master Tasks': 3001231,
  };

  /** Raw data from API */
  private navData = signal<NavigationData | null>(null);
  loading = signal<boolean>(false);
  loaded = signal<boolean>(false);

  /** Active (visible) top-level modules, sorted */
  activeModules = computed(() => {
    const data = this.navData();
    if (!data) return [];
    return data.modules.filter(m => Number(m.IsActive) === 1);
  });

  /** All top-level modules (including inactive) */
  allModules = computed(() => this.navData()?.modules ?? []);

  /** Children grouped by ParentObjNo */
  childrenByParent = computed(() => {
    const data = this.navData();
    if (!data) return new Map<string, NavChild[]>();

    const map = new Map<string, NavChild[]>();

    // TODO(backend-003): REMOVE deduplication once Theo fixes ReadNavigation JOIN (it produces duplicate rows)
    const seen = new Set<string>();

    for (const child of data.children) {
      const isErm = Number(child.ParentObjNo) === this.ERM_OBJ_NO;

      // Dedup key for ERM children: use ObjNo to skip duplicate FormID rows
      if (isErm) {
        const key = String(child.ObjNo);
        if (seen.has(key)) continue;
        seen.add(key);

        // TODO(backend-003): REMOVE override logic once ReadNavigation returns correct FormIDs
        const override = this.FORM_ID_OVERRIDES[child.Code];
        if (override) {
          child.FormID = String(override);
        } else {
          child.FormID = null; // Don't trust the DB value yet
        }
      }

      const parentKey = String(child.ParentObjNo);
      const list = map.get(parentKey) ?? [];
      list.push(child);
      map.set(parentKey, list);
    }

    return map;
  });

  /** ERM children specifically (convenience accessor) */
  ermChildren = computed(() => {
    return this.childrenByParent().get(String(this.ERM_OBJ_NO)) ?? [];
  });

  constructor(private apiService: ApiService) {}

  /** Load navigation tree (call once on app start) */
  loadNavigation(): void {
    if (this.loaded() || this.loading()) return;

    this.loading.set(true);
    this.apiService.get<ApiResponse<NavigationData>>('/api/navigation').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.navData.set(response.data);
        }
        this.loading.set(false);
        this.loaded.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.loaded.set(true);
      }
    });
  }

  /** Get children for a specific module */
  getChildren(moduleObjNo: string | number): NavChild[] {
    return this.childrenByParent().get(String(moduleObjNo)) ?? [];
  }
}
