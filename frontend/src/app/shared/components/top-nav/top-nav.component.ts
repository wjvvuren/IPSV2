import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationService, NavModule, NavChild } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.scss'
})
export class TopNavComponent implements OnInit {
  private navService = inject(NavigationService);

  activeModule = signal<NavModule | null>(null);

  modules = this.navService.activeModules;
  loaded = this.navService.loaded;

  /** Children for the currently hovered module */
  activeChildren = computed(() => {
    const mod = this.activeModule();
    if (!mod) return [];
    return this.navService.getChildren(mod.ObjNo);
  });

  ngOnInit(): void {
    this.navService.loadNavigation();
  }

  onModuleHover(mod: NavModule): void {
    this.activeModule.set(mod);
  }

  onModuleLeave(): void {
    // Delay clearing so user can move to dropdown
  }

  clearActiveModule(): void {
    this.activeModule.set(null);
  }

  /** Get the route for a child item */
  getChildRoute(child: NavChild): string[] {
    if (child.FormID) {
      return ['/form', String(child.FormID)];
    }
    // Non-ERM children — no page yet, just route to a placeholder
    return ['/module', String(child.ParentObjNo), String(child.ObjNo)];
  }

  /** Check if a child is an ERM item with a FormID */
  isErmItem(child: NavChild): boolean {
    return child.FormID !== null;
  }
}
