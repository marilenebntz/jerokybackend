import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { MAX_IMAGE_BYTES } from '../faces/constants';

@ApiTags('Students')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Post()
  async create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR, UserRole.DOCENTE)
  @Get()
  async findAll() {
    return this.studentsService.findAll();
  }

  @Roles(
    UserRole.ADMIN,
    UserRole.OPERADOR,
    UserRole.DOCENTE,
    UserRole.ALUMNO,
    UserRole.TUTOR,
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.studentsService.updateStatus(id, status);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Post('enroll')
  async enroll(@Body() enrollStudentDto: EnrollStudentDto) {
    return this.studentsService.enroll(enrollStudentDto);
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
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
  ) {
    return this.studentsService.transfer(
      enrollmentId,
      targetCourseId,
    );
  }

  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Get('info/tutors')
  async getTutors() {
    return this.studentsService.getTutors();
  }

  @ApiOperation({
    summary: 'Registrar o actualizar rostro biométrico del alumno',
    description: 'Enrola una muestra facial en AWS Rekognition vía archivo multipart o base64',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiResponse({ status: 201, description: 'Rostro biométrico registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Imagen inválida o no se detectó rostro' })
  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Post(':id/face')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
    }),
  )
  async registerFace(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body('image') imageBase64?: string,
  ) {
    let buffer: Buffer;

    if (file && file.buffer?.length) {
      if (!file.mimetype?.startsWith('image/')) {
        throw new BadRequestException('Solo se permiten archivos de imagen');
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new BadRequestException('La imagen supera el límite de 5 MB');
      }
      buffer = file.buffer;
    } else if (imageBase64 && typeof imageBase64 === 'string') {
      const cleanBase64 = imageBase64.includes('base64,')
        ? imageBase64.split('base64,')[1]
        : imageBase64;
      buffer = Buffer.from(cleanBase64, 'base64');
      if (!buffer || buffer.length === 0) {
        throw new BadRequestException('Imagen en base64 inválida');
      }
      if (buffer.length > MAX_IMAGE_BYTES) {
        throw new BadRequestException('La imagen supera el límite de 5 MB');
      }
    } else {
      throw new BadRequestException('Debe enviar un archivo o imagen en base64');
    }

    return this.studentsService.registerFace(id, buffer);
  }

  @ApiOperation({
    summary: 'Eliminar plantilla biométrica del alumno',
    description: 'Elimina el rostro indexado en AWS Rekognition y limpia el biometricTemplateId',
  })
  @ApiResponse({ status: 200, description: 'Rostro biométrico eliminado correctamente' })
  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Delete(':id/face')
  async deleteFace(@Param('id') id: string) {
    return this.studentsService.deleteFace(id);
  }
}
