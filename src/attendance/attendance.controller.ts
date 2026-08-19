import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';
import { BiometricCheckInDto } from './dto/biometric-checkin.dto';
import { DocumentCheckInDto } from './dto/document-checkin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.DOCENTE)
  @Post('biometric')
  async checkInBiometric(@Body() dto: BiometricCheckInDto) {
    return this.attendanceService.checkInBiometric(dto.image);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.DOCENTE)
  @Post('document')
  async checkInByDocument(@Body() dto: DocumentCheckInDto) {
    return this.attendanceService.checkInByDocument(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.DOCENTE)
  @Post('manual')
  async checkInManual(@Body() dto: ManualAttendanceDto) {
    return this.attendanceService.checkInManual(dto);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.DOCENTE)
  @Get('by-date')
  async getAttendancesByDate(
    @Query('courseId', ParseUUIDPipe) courseId: string,
    @Query('date') date: string,
  ) {
    return this.attendanceService.getAttendancesByDate(courseId, date);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.DOCENTE)
  @Get('reports')
  async getReports(
    @Query('courseId', new ParseUUIDPipe({ optional: true })) courseId?: string,
    @Query('period') period?: string,
    @Query('year') year?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.attendanceService.getReports(courseId, period, yearNum);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.DOCENTE)
  @Delete(':id')
  async deleteAttendance(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.deleteAttendance(id);
  }
}
