import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradeUploadItemDto } from './dto/upload-grades-batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Roles(UserRole.ADMIN, UserRole.DOCENTE)
  @Post('batch')
  async saveBatch(@Body('grades') grades: GradeUploadItemDto[]) {
    return this.gradesService.saveBatch(grades);
  }

  @Roles(
    UserRole.ADMIN,
    UserRole.DOCENTE,
    UserRole.DIRECTOR,
    UserRole.OPERADOR,
    UserRole.ALUMNO,
    UserRole.TUTOR,
  )
  @Get('student/:studentId')
  async getHistoryByStudent(@Param('studentId') studentId: string) {
    return this.gradesService.getHistoryByStudent(studentId);
  }

  @Roles(UserRole.ADMIN, UserRole.DIRECTOR)
  @Get('stats/averages')
  async getAverageGradesByStyle() {
    return this.gradesService.getAverageGradesByStyle();
  }
}
