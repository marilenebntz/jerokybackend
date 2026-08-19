import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseBodyDto, UpdateCourseBodyDto } from './dto/course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  /** Create a new course with its schedules (master-detail) */
  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Post()
  async create(@Body() body: CreateCourseBodyDto) {
    return this.coursesService.create(body);
  }

  /** Get all courses (includes eager-loaded schedules and teacher) */
  @Roles(
    UserRole.ADMIN,
    UserRole.OPERADOR,
    UserRole.DOCENTE,
    UserRole.ALUMNO,
  )
  @Get()
  async findAll() {
    return this.coursesService.findAll();
  }

  /** Get a single course by ID */
  @Roles(
    UserRole.ADMIN,
    UserRole.OPERADOR,
    UserRole.DOCENTE,
    UserRole.ALUMNO,
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  /** Update a course and optionally replace its schedules */
  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCourseBodyDto) {
    return this.coursesService.update(id, body);
  }

  /** Delete a course (cascades to its schedules and enrollment records) */
  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}
