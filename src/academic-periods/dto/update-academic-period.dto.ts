import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAcademicPeriodDto {
  @ApiPropertyOptional({
    description: 'Nombre o denominación de la etapa evaluativa/período',
    example: '1ª Etapa',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio de la etapa (YYYY-MM-DD)',
    example: '2026-02-01',
  })
  @IsOptional()
  @IsISO8601(
    {},
    {
      message:
        'La fecha de inicio debe tener un formato de fecha válido (YYYY-MM-DD)',
    },
  )
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin de la etapa (YYYY-MM-DD)',
    example: '2026-06-30',
  })
  @IsOptional()
  @IsISO8601(
    {},
    {
      message:
        'La fecha de fin debe tener un formato de fecha válido (YYYY-MM-DD)',
    },
  )
  endDate?: string;
}
