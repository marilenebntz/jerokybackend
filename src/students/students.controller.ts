import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.DIRECTOR)
  @Post()
  async create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.DIRECTOR, UserRole.DOCENTE)
  @Get()
  async findAll() {
    return this.studentsService.findAll();
  }

  @Roles(
    UserRole.ADMIN,
    UserRole.OPERADOR,
    UserRole.DIRECTOR,
    UserRole.DOCENTE,
    UserRole.ALUMNO,
    UserRole.TUTOR,
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Post('enroll')
  async enroll(@Body() enrollStudentDto: EnrollStudentDto) {
    return this.studentsService.enroll(enrollStudentDto);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.DIRECTOR)
  @Get('info/enrollments')
  async getEnrollments() {
    return this.studentsService.getEnrollments();
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Patch('enrollments/:id/status')
  async updateEnrollmentStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.studentsService.updateEnrollmentStatus(id, status);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Post('transfer')
  async transfer(
    @Body('enrollmentId') enrollmentId: string,
    @Body('targetCourseId') targetCourseId: string,
    @Body('academicPeriod') academicPeriod: string,
  ) {
    return this.studentsService.transfer(
      enrollmentId,
      targetCourseId,
      academicPeriod,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Get('info/tutors')
  async getTutors() {
    return this.studentsService.getTutors();
  }
}
