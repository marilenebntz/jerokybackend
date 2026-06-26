import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommunicationsService } from './communications.service';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communications')
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.DOCENTE, UserRole.OPERADOR)
  @Post()
  async create(@Body() dto: CreateCommunicationDto, @Request() req: any) {
    return this.communicationsService.create(dto, req.user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.OPERADOR)
  @Get('logs')
  async getLogs() {
    return this.communicationsService.getLogs();
  }

  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTOR,
    UserRole.DOCENTE,
    UserRole.OPERADOR,
    UserRole.ALUMNO,
    UserRole.TUTOR,
  )
  @Get()
  async getCommunications() {
    return this.communicationsService.getCommunications();
  }
}
