import { Injectable } from '@angular/core';

export interface ApiRequestLog {
  id: string;
  method: string;
  url: string;
  requestBody?: unknown;
  responseBody?: unknown;
  statusCode?: number;
  duration?: number;
  timestamp: Date;
  procedureName?: string;
  error?: string;
}
