import {
  IsOptional,
  IsBoolean,
  Matches,
  Length,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTutorDto } from './create-tutor.dto';

export class UpdateStudentDto {
  @IsOptional()
  @Length(3, 30, { message: 'El nombre debe tener entre 3 y 30 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre solo debe contener letras',
  })
  firstName?: string;

  @IsOptional()
  @Length(3, 30, { message: 'El apellido debe tener entre 3 y 30 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El apellido solo debe contener letras',
  })
  lastName?: string;

  @IsOptional()
  @Matches(/^\d{6,15}$/, {
    message: 'La CI debe ser numérica y tener un mínimo de 6 dígitos',
  })
  ci?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Debe ingresar una fecha de nacimiento válida (YYYY-MM-DD)' },
  )
  birthDate?: string;

  @IsOptional()
  encryptedMedicalInfo?: string;

  @IsOptional()
  @IsBoolean({ message: 'El consentimiento biométrico debe ser un booleano' })
  biometricConsent?: boolean;

  @IsOptional()
  tutorId?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTutorDto)
  tutor?: CreateTutorDto;

  @IsOptional()
  status?: string;
}
