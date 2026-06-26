import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.OPERADOR)
  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.systemService.getDashboardStats();
  }

  @Roles(UserRole.ADMIN)
  @Post('backup')
  async generateBackup(@Request() req: any) {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    return this.systemService.generateBackup(req.user.id, req.user.email, ip);
  }

  @Roles(UserRole.ADMIN)
  @Get('backup/interval')
  getBackupInterval() {
    return { intervalMinutes: this.systemService.getBackupInterval() };
  }

  @Roles(UserRole.ADMIN)
  @Post('backup/interval')
  setBackupInterval(@Body('minutes') minutes: number) {
    const interval = this.systemService.setBackupInterval(minutes);
    return { success: true, intervalMinutes: interval };
  }
}
