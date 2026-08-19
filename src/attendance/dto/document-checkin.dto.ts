import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { AttendanceType } from '../entities/attendance.entity';

export class DocumentCheckInDto {
  @IsNotEmpty({ message: 'La Cédula de Identidad es requerida' })
  @IsString({ message: 'La Cédula de Identidad debe ser texto' })
  ci: string;

  @IsOptional()
  @IsEnum(AttendanceType, { message: 'El tipo debe ser Entrada o Salida' })
  type?: AttendanceType;

  @IsOptional()
  @IsUUID('4', { message: 'El courseId debe ser un UUID válido' })
  courseId?: string;
}
