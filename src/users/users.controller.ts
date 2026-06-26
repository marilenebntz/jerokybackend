import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN, UserRole.DIRECTOR, UserRole.DOCENTE, UserRole.OPERADOR)
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  async create(
    @Body('email') email: string,
    @Body('password') passwordPlain: string,
    @Body('role') role: UserRole,
    @Body('firstName') firstName?: string,
    @Body('lastName') lastName?: string,
  ) {
    return this.usersService.create(
      email,
      passwordPlain || 'password123',
      role,
      firstName,
      lastName,
    );
  }
}
