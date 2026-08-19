import { IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { AttendanceType } from '../entities/attendance.entity';

export class ManualAttendanceDto {
  @IsNotEmpty({ message: 'El ID del estudiante es obligatorio' })
  @IsUUID('4', { message: 'El ID del estudiante debe ser un UUID válido' })
  studentId: string;

  @IsNotEmpty({ message: 'El ID del curso es obligatorio' })
  @IsUUID('4', { message: 'El ID del curso debe ser un UUID válido' })
  courseId: string;

  @IsOptional()
  @IsEnum(AttendanceType, {
    message: "El tipo debe ser 'Entrada' o 'Salida'",
  })
  type?: AttendanceType;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'El timestamp debe ser una fecha ISO válida' },
  )
  timestamp?: string;
}
