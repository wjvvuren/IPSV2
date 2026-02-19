import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationService, NavModule, NavChild } from '../../../core/services/navigation.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  private navService = inject(NavigationService);

  /** Track which module sections are expanded (by ObjNo) */
  expandedModules = signal<Set<string>>(new Set());

  modules = this.navService.activeModules;
  loaded = this.navService.loaded;

  ngOnInit(): void {
    this.navService.loadNavigation();
  }

  /** Get children for a module */
  getChildren(moduleObjNo: string | number): NavChild[] {
    return this.navService.getChildren(moduleObjNo);
  }

  /** Check if a module section is expanded */
  isExpanded(moduleObjNo: string | number): boolean {
    return this.expandedModules().has(String(moduleObjNo));
  }

  /** Toggle a module section */
  toggleModule(moduleObjNo: string | number): void {
    const key = String(moduleObjNo);
    const current = new Set(this.expandedModules());
    if (current.has(key)) {
      current.delete(key);
    } else {
      current.add(key);
    }
    this.expandedModules.set(current);
  }

  /** Get the route for a child nav item */
  getChildRoute(child: NavChild): string[] {
    if (child.FormID) {
      return ['/form', String(child.FormID)];
    }
    return ['/module', String(child.ParentObjNo), String(child.ObjNo)];
  }

  /** Check if a child is an ERM item */
  isErmChild(child: NavChild): boolean {
    return child.FormID !== null;
  }
}
