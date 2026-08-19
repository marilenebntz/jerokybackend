import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EvaluationStage } from '../entities/academic-period.entity';

export class CreateAcademicPeriodDto {
  @ApiProperty({
    description: 'Año lectivo del ciclo académico',
    example: 2026,
  })
  @IsNotEmpty({ message: 'El año es obligatorio' })
  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(2000, { message: 'El año debe ser válido (mínimo 2000)' })
  @Max(2100, { message: 'El año debe ser válido (máximo 2100)' })
  @Type(() => Number)
  year: number;

  @ApiProperty({
    description: 'Nombre o denominación de la etapa evaluativa/período',
    example: '1ª Etapa',
  })
  @IsNotEmpty({ message: 'El nombre de la etapa o período es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsEnum(EvaluationStage, {
    message:
      'El nombre de la etapa debe ser válido (1ª Etapa, 2ª Etapa, Examen Final, Recuperatorio)',
  })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Fecha de inicio de la etapa (YYYY-MM-DD)',
    example: '2026-02-01',
  })
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  @IsISO8601(
    {},
    {
      message:
        'La fecha de inicio debe tener un formato de fecha válido (YYYY-MM-DD)',
    },
  )
  startDate: string;

  @ApiProperty({
    description: 'Fecha de fin de la etapa (YYYY-MM-DD)',
    example: '2026-06-30',
  })
  @IsNotEmpty({ message: 'La fecha de fin es obligatoria' })
  @IsISO8601(
    {},
    {
      message:
        'La fecha de fin debe tener un formato de fecha válido (YYYY-MM-DD)',
    },
  )
  endDate: string;
}
