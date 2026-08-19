import {
  IsNotEmpty,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvaluationStage } from '../entities/grade.entity';

export class GradeUploadItemDto {
  @ApiProperty({
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    description: 'ID del alumno',
  })
  @IsNotEmpty({ message: 'El ID del alumno es obligatorio' })
  @IsUUID('4', { message: 'El ID del alumno debe ser un UUID válido' })
  studentId: string;

  @ApiPropertyOptional({
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    description: 'ID del curso (opcional si se define a nivel de lote)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del curso debe ser un UUID válido' })
  courseId?: string;

  @ApiProperty({
    example: 85,
    minimum: 0,
    maximum: 100,
    description: 'Nota de Técnica (0-100)',
  })
  @IsNotEmpty({ message: 'La nota de Técnica es obligatoria' })
  @IsInt({ message: 'La nota de Técnica debe ser un número entero' })
  @Min(0, { message: 'La nota mínima es 0' })
  @Max(100, { message: 'La nota máxima es 100' })
  techniqueScore: number;

  @ApiProperty({
    example: 90,
    minimum: 0,
    maximum: 100,
    description: 'Nota de Expresión (0-100)',
  })
  @IsNotEmpty({ message: 'La nota de Expresión es obligatoria' })
  @IsInt({ message: 'La nota de Expresión debe ser un número entero' })
  @Min(0, { message: 'La nota mínima es 0' })
  @Max(100, { message: 'La nota máxima es 100' })
  expressionScore: number;

  @ApiProperty({
    example: 95,
    minimum: 0,
    maximum: 100,
    description: 'Nota de Disciplina (0-100)',
  })
  @IsNotEmpty({ message: 'La nota de Disciplina es obligatoria' })
  @IsInt({ message: 'La nota de Disciplina debe ser un número entero' })
  @Min(0, { message: 'La nota mínima es 0' })
  @Max(100, { message: 'La nota máxima es 100' })
  disciplineScore: number;

  @ApiPropertyOptional({
    enum: EvaluationStage,
    example: EvaluationStage.ETAPA_1,
    description: 'Etapa evaluativa (opcional si se define a nivel de lote)',
  })
  @IsOptional()
  @IsEnum(EvaluationStage, {
    message:
      'La etapa debe ser una etapa válida (1ª Etapa, 2ª Etapa, Examen Final, Recuperatorio)',
  })
  stage?: EvaluationStage;
}

export class UploadGradesBatchDto {
  @ApiPropertyOptional({
    example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    description: 'ID del curso aplicable al lote de calificaciones',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El ID del curso debe ser un UUID válido' })
  courseId?: string;

  @ApiPropertyOptional({
    enum: EvaluationStage,
    example: EvaluationStage.ETAPA_1,
    description: 'Etapa evaluativa oficial aplicable al lote de calificaciones',
  })
  @IsOptional()
  @IsEnum(EvaluationStage, {
    message:
      'La etapa debe ser una etapa válida (1ª Etapa, 2ª Etapa, Examen Final, Recuperatorio)',
  })
  stage?: EvaluationStage;

  @ApiProperty({
    type: [GradeUploadItemDto],
    description: 'Lista de notas de estudiantes a registrar o actualizar',
  })
  @IsArray({ message: 'Las notas deben ser enviadas como una lista' })
  @ValidateNested({ each: true })
  @Type(() => GradeUploadItemDto)
  @IsNotEmpty({ message: 'La lista de notas no puede estar vacía' })
  grades: GradeUploadItemDto[];
}

export { UploadGradesBatchDto as BatchUploadGradesDto };


