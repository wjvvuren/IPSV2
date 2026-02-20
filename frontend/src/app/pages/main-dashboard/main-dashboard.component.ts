import { Component, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

interface KpiCard {
  label: string;
  value: string;
  icon: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  colour: string;
}

interface RecentTransaction {
  id: number;
  date: string;
  client: string;
  type: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
}

interface ActivityItem {
  time: string;
  description: string;
  user: string;
}

@Component({
  selector: 'app-main-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, TableModule, TagModule, ButtonModule, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './main-dashboard.component.html',
  styleUrl: './main-dashboard.component.scss',
})
export class MainDashboardComponent {
  /** KPI summary cards — demo data */
  kpis = signal<KpiCard[]>([
    {
      label: 'Total Clients',
      value: '4,218',
      icon: 'pi pi-users',
      trend: 'up',
      trendValue: '+3.2%',
      colour: '#3b82f6',
    },
    {
      label: 'Active Loans',
      value: '1,847',
      icon: 'pi pi-wallet',
      trend: 'up',
      trendValue: '+1.8%',
      colour: '#10b981',
    },
    {
      label: 'Portfolio Value',
      value: 'R 284.5M',
      icon: 'pi pi-chart-line',
      trend: 'up',
      trendValue: '+5.4%',
      colour: '#8b5cf6',
    },
    {
      label: 'Overdue Accounts',
      value: '63',
      icon: 'pi pi-exclamation-triangle',
      trend: 'down',
      trendValue: '-2.1%',
      colour: '#ef4444',
    },
  ]);

  /** Recent transactions — demo data */
  transactions = signal<RecentTransaction[]>([
    { id: 1001, date: '2026-02-20', client: 'Solaris Holdings (Pty) Ltd', type: 'Disbursement', amount: 1250000, status: 'Completed' },
    { id: 1002, date: '2026-02-20', client: 'Ngwenya Trading CC', type: 'Repayment', amount: 45000, status: 'Completed' },
    { id: 1003, date: '2026-02-19', client: 'Boitekong Farming Co-op', type: 'Disbursement', amount: 780000, status: 'Pending' },
    { id: 1004, date: '2026-02-19', client: 'Lebogang Mtshali', type: 'Repayment', amount: 12500, status: 'Completed' },
    { id: 1005, date: '2026-02-18', client: 'Mpho Infrastructure (Pty) Ltd', type: 'Fee', amount: 3500, status: 'Failed' },
    { id: 1006, date: '2026-02-18', client: 'Tshepo Mokoena', type: 'Disbursement', amount: 350000, status: 'Completed' },
    { id: 1007, date: '2026-02-17', client: 'Vukani Logistics', type: 'Repayment', amount: 98000, status: 'Pending' },
    { id: 1008, date: '2026-02-17', client: 'Sizwe Nkosi', type: 'Disbursement', amount: 520000, status: 'Completed' },
  ]);

  /** Recent activity feed — demo data */
  activities = signal<ActivityItem[]>([
    { time: '09:42', description: 'New loan application submitted', user: 'Johan van Wyk' },
    { time: '09:15', description: 'Client KYC documents approved', user: 'Thandi Ndlovu' },
    { time: '08:50', description: 'Disbursement processed — R 1.25M', user: 'System' },
    { time: '08:30', description: 'Overdue notice sent to 12 accounts', user: 'System' },
    { time: 'Yesterday', description: 'Monthly portfolio report generated', user: 'Admin' },
    { time: 'Yesterday', description: 'Interest rate schedule updated', user: 'Pieter du Plessis' },
  ]);

  /** Monthly breakdown — demo data for the bar chart */
  monthlyData = signal([
    { month: 'Sep', disbursed: 18.2, collected: 14.8 },
    { month: 'Oct', disbursed: 22.1, collected: 16.3 },
    { month: 'Nov', disbursed: 19.7, collected: 18.1 },
    { month: 'Dec', disbursed: 15.4, collected: 17.9 },
    { month: 'Jan', disbursed: 24.3, collected: 19.2 },
    { month: 'Feb', disbursed: 21.8, collected: 20.5 },
  ]);

  /** Get max value for chart scaling */
  chartMax(): number {
    const data = this.monthlyData();
    return Math.max(...data.map(d => Math.max(d.disbursed, d.collected))) * 1.15;
  }

  barHeight(value: number): string {
    return `${(value / this.chartMax()) * 100}%`;
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'danger' | 'info' {
    switch (status) {
      case 'Completed': return 'success';
      case 'Pending': return 'warning';
      case 'Failed': return 'danger';
      default: return 'info';
    }
  }
}
