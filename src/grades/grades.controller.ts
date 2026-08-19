import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { UploadGradesBatchDto } from './dto/upload-grades-batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Grades')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @ApiOperation({ summary: 'Batch register or update student evaluations by stage' })
  @ApiResponse({ status: 201, description: 'Grades registered or updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error in marks or payload' })
  @ApiResponse({ status: 404, description: 'Student or Course not found' })
  @Roles(UserRole.ADMIN, UserRole.DOCENTE)
  @Post('batch')
  async saveBatch(@Body() body: UploadGradesBatchDto) {
    return this.gradesService.uploadBatch(
      body.grades,
      body.courseId,
      body.stage,
    );
  }

  @ApiOperation({ summary: 'Get academic grade history for a student' })
  @ApiResponse({ status: 200, description: 'Array of student grades' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @Roles(
    UserRole.ADMIN,
    UserRole.DOCENTE,
    UserRole.OPERADOR,
    UserRole.ALUMNO,
    UserRole.TUTOR,
  )
  @Get('student/:studentId')
  async getHistoryByStudent(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.gradesService.getHistoryByStudent(studentId);
  }

  @ApiOperation({ summary: 'Get grades for a specific course and stage' })
  @ApiResponse({ status: 200, description: 'Array of grades for the course and stage' })
  @Roles(UserRole.ADMIN, UserRole.DOCENTE, UserRole.OPERADOR)
  @Get('course/:courseId')
  async getGradesByCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query('stage') stage?: string,
  ) {
    return this.gradesService.findByCourseAndStage(courseId, stage);
  }

  @ApiOperation({ summary: 'Get statistical averages grouped by dance style' })
  @ApiResponse({ status: 200, description: 'Average scores grouped by discipline' })
  @Roles(UserRole.ADMIN)
  @Get('stats/averages')
  async getAverageGradesByStyle() {
    return this.gradesService.getAverageGradesByStyle();
  }
}

