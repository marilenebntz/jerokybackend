import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AcademicPeriodsService } from './academic-periods.service';
import { CreateAcademicPeriodDto } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';
import { QueryAcademicPeriodDto } from './dto/query-academic-period.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Academic Periods')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic-periods')
export class AcademicPeriodsController {
  constructor(
    private readonly academicPeriodsService: AcademicPeriodsService,
  ) {}

  @ApiOperation({ summary: 'List academic periods / stages' })
  @ApiResponse({ status: 200, description: 'Array of academic periods' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(
    UserRole.ADMIN,
    UserRole.OPERADOR,
    UserRole.DOCENTE,
    UserRole.ALUMNO,
    UserRole.TUTOR,
  )
  @Get()
  async findAll(@Query() query: QueryAcademicPeriodDto) {
    return this.academicPeriodsService.findAll(query.year, query.name);
  }

  @ApiOperation({ summary: 'List all distinct academic years with records' })
  @ApiResponse({ status: 200, description: 'Array of years (numbers)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(
    UserRole.ADMIN,
    UserRole.OPERADOR,
    UserRole.DOCENTE,
    UserRole.ALUMNO,
    UserRole.TUTOR,
  )
  @Get('years')
  async getYears() {
    return this.academicPeriodsService.getDistinctYears();
  }

  @ApiOperation({ summary: 'Get academic period by ID' })
  @ApiResponse({ status: 200, description: 'Academic period details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Period not found' })
  @Roles(
    UserRole.ADMIN,
    UserRole.OPERADOR,
    UserRole.DOCENTE,
    UserRole.ALUMNO,
    UserRole.TUTOR,
  )
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicPeriodsService.findById(id);
  }

  @ApiOperation({ summary: 'Create or update an academic stage definition' })
  @ApiResponse({
    status: 201,
    description: 'Academic period configured successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (e.g. invalid date order)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Post()
  async createOrUpdate(@Body() dto: CreateAcademicPeriodDto) {
    return this.academicPeriodsService.createOrUpdate(dto);
  }

  @ApiOperation({ summary: 'Update stage dates by ID' })
  @ApiResponse({ status: 200, description: 'Academic period updated' })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Period not found' })
  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicPeriodDto,
  ) {
    return this.academicPeriodsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete academic period by ID' })
  @ApiResponse({
    status: 200,
    description: 'Period deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete period with associated grades',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Period not found' })
  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicPeriodsService.delete(id);
  }

  @ApiOperation({
    summary: 'Initialize default Paraguayan academic stages for a year',
  })
  @ApiResponse({
    status: 201,
    description: 'List of seeded academic periods',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @Roles(UserRole.ADMIN, UserRole.OPERADOR)
  @Post('seed/:year')
  async seedDefaults(@Param('year', ParseIntPipe) year: number) {
    return this.academicPeriodsService.seedDefaults(year);
  }
}
