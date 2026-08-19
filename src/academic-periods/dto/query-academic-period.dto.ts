import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryAcademicPeriodDto {
  @ApiPropertyOptional({
    description: 'Filtrar etapas por año lectivo',
    example: 2026,
  })
  @IsOptional()
  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(2000, { message: 'El año debe ser válido (mínimo 2000)' })
  @Max(2100, { message: 'El año debe ser válido (máximo 2100)' })
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por nombre de etapa evaluativa',
    example: '1ª Etapa',
  })
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name?: string;
}
