import { IsEmail, IsNotEmpty, Matches, Length } from 'class-validator';

export class CreateTutorDto {
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

  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  @Matches(/^\d{6,15}$/, {
    message: 'La cédula debe ser numérica y tener un mínimo de 6 dígitos',
  })
  ci: string;

  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  @Matches(/^\+?[\d\s-]{6,20}$/, {
    message: 'El teléfono debe ser válido (mínimo 6 dígitos)',
  })
  phone: string;

  @IsNotEmpty({ message: 'El email es obligatorio' })
  @IsEmail({}, { message: 'Debe ingresar un email válido' })
  email: string;
}
