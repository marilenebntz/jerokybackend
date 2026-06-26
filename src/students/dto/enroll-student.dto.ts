import { IsNotEmpty, IsUUID, IsString } from 'class-validator';

export class EnrollStudentDto {
  @IsNotEmpty({ message: 'El ID del alumno es obligatorio' })
  @IsUUID('4', { message: 'El ID del alumno debe ser un UUID válido' })
  studentId: string;

  @IsNotEmpty({ message: 'El ID de la modalidad/curso es obligatorio' })
  @IsUUID('4', { message: 'El ID del curso debe ser un UUID válido' })
  courseId: string;

  @IsNotEmpty({ message: 'El periodo académico es obligatorio' })
  @IsString({ message: 'El periodo debe ser una cadena de texto' })
  academicPeriod: string; // e.g., "2026-I"
}
