import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { Alert } from './entities/alert.entity';
import { DeleteResult, UpdateResult } from 'typeorm';

@Controller('alert')
export class AlertController {
  constructor(private readonly alertService: AlertService) { }

  // Creates a new Alert
  @Post()
  create(@Body() createAlertDto: CreateAlertDto): Promise<Alert> {
    return this.alertService.create(createAlertDto);
  }

  // Resets all alerts back to false
  @Post('reset-all-alerts-false')
  resetAlerts(): Promise<Alert[]> {
    return this.alertService.resetAlerts();
  }

  // Find all alerts regardless of state or situation
  @Get()
  findAll(): Promise<Alert[]> {
    return this.alertService.findAll();
  }

  @Get('find-all-alerts')
  findAllAlerts(): Promise<Alert[]> {
    return this.alertService.findAll();
  }

  // Get a specific Alert by it's AlertId (it's id)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Alert> {
    return this.alertService.findOne(id);
  }

  // Use the database to update the state of alerts (usually done when a reset happens)
  @Patch('shallow-update-alerts')
  shallowUpdateAlerts(): Promise<void>{
    return this.alertService.shallowUpdateAlerts()
  }

  // Patch an alert by it's ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlertDto: UpdateAlertDto): Promise<UpdateResult> {
    return this.alertService.update(id, updateAlertDto);
  }

  // Remove an alert by it's ID
  @Delete(':id')
  remove(@Param('id') id: string): Promise<DeleteResult> {
    return this.alertService.remove(id);
  }
}
