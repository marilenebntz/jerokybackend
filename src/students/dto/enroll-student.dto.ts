import { IsNotEmpty, IsUUID } from 'class-validator';

export class EnrollStudentDto {
  @IsNotEmpty({ message: 'El ID del alumno es obligatorio' })
  @IsUUID('4', { message: 'El ID del alumno debe ser un UUID válido' })
  studentId: string;

  @IsNotEmpty({ message: 'El ID de la modalidad/curso es obligatorio' })
  @IsUUID('4', { message: 'El ID del curso debe ser un UUID válido' })
  courseId: string;
}
