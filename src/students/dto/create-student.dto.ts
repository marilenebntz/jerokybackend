import {
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Matches,
  Length,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTutorDto } from './create-tutor.dto';

export class CreateStudentDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Length(3, 30, { message: 'El nombre debe tener entre 3 y 30 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre solo debe contener letras',
  })
  firstName: string;

  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @Length(3, 30, { message: 'El apellido debe tener entre 3 y 30 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El apellido solo debe contener letras',
  })
  lastName: string;

  @IsNotEmpty({ message: 'La cédula de identidad (CI) es obligatoria' })
  @Matches(/^\d{6,15}$/, {
    message: 'La CI debe ser numérica y tener un mínimo de 6 dígitos',
  })
  ci: string;

  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsDateString(
    {},
    { message: 'Debe ingresar una fecha de nacimiento válida (YYYY-MM-DD)' },
  )
  birthDate: string;

  @IsOptional()
  encryptedMedicalInfo?: string;

  @IsOptional()
  @IsBoolean({ message: 'El consentimiento biométrico debe ser un booleano' })
  biometricConsent?: boolean;

  @IsOptional()
  tutorId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTutorDto)
  tutor?: CreateTutorDto;
}
