import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';

export interface ErmForm {
  id: number;
  name: string;
  code: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  ermForms = signal<ErmForm[]>([]);
  ermExpanded = signal<boolean>(true);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadForms();
  }

  loadForms(): void {
    this.apiService.get<ApiResponse<ErmForm[]>>('/api/erm/forms').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.ermForms.set(response.data);
        }
      }
    });
  }

  toggleErm(): void {
    this.ermExpanded.set(!this.ermExpanded());
  }
}
