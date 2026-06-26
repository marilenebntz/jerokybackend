import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.DOCENTE) // Checkpoint device/user auth
  @Post('biometric')
  async checkInBiometric(@Body('image') image: string) {
    return this.attendanceService.checkInBiometric(image);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.DIRECTOR, UserRole.DOCENTE)
  @Get('reports')
  async getReports(
    @Query('courseId') courseId?: string,
    @Query('period') period?: string,
  ) {
    return this.attendanceService.getReports(courseId, period);
  }
}
