import { Injectable } from '@nestjs/common';
import { AlertService } from './alert.service';
import { Tool } from '@rekog/mcp-nest';
import z from 'zod';

@Injectable()
export class ListAlertTools {
  constructor(private alertService: AlertService) { }

  @Tool({
    name: 'alerts.list',
    description: 'Return all alerts',
    // no inputs needed
    parameters: z.object({}),
  })
  async findAlerts() {
    return this.alertService.findAll();
  }
  @Tool({
    name: 'alerts.shallow-update',
    description:
      'A simple update done on the database side requiring no inputs',
    // no inputs needed
    parameters: z.object({}).passthrough(),
  })
  async shallowUpdateAlerts() {
    return this.alertService.shallowUpdateAlerts();
  }
  @Tool({
    name: 'alerts.reset',
    description: 'Reset all alerts back to false',
    // no inputs needed
    parameters: z.object({}),
  })
  async resetAlerts() {
    return this.alertService.resetAlerts();
  }
}
