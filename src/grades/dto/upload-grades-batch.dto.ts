import { IsNotEmpty, IsUUID, IsInt, Min, Max, IsEnum } from 'class-validator';
import { EvaluationStage } from '../entities/grade.entity';

export class GradeUploadItemDto {
  @IsNotEmpty({ message: 'El ID del alumno es obligatorio' })
  @IsUUID('4', { message: 'El ID del alumno debe ser un UUID válido' })
  studentId: string;

  @IsNotEmpty({ message: 'El ID del curso es obligatorio' })
  @IsUUID('4', { message: 'El ID del curso debe ser un UUID válido' })
  courseId: string;

  @IsNotEmpty({ message: 'La nota de Técnica es obligatoria' })
  @IsInt({ message: 'La nota de Técnica debe ser un número entero' })
  @Min(0, { message: 'La nota mínima es 0' })
  @Max(100, { message: 'La nota máxima es 100' })
  techniqueScore: number;

  @IsNotEmpty({ message: 'La nota de Expresión es obligatoria' })
  @IsInt({ message: 'La nota de Expresión debe ser un número entero' })
  @Min(0, { message: 'La nota mínima es 0' })
  @Max(100, { message: 'La nota máxima es 100' })
  expressionScore: number;

  @IsNotEmpty({ message: 'La nota de Disciplina es obligatoria' })
  @IsInt({ message: 'La nota de Disciplina debe ser un número entero' })
  @Min(0, { message: 'La nota mínima es 0' })
  @Max(100, { message: 'La nota máxima es 100' })
  disciplineScore: number;

  @IsNotEmpty({ message: 'La etapa de evaluación es obligatoria' })
  @IsEnum(EvaluationStage, {
    message: 'La etapa debe ser una etapa válida (1ª Etapa, 2ª Etapa, Examen Final, Recuperatorio)',
  })
  stage: EvaluationStage;
}

export class BatchUploadGradesDto {
  @IsNotEmpty({ message: 'La lista de notas no puede estar vacía' })
  grades: GradeUploadItemDto[];
}
