import { IsEmail, IsNotEmpty, IsOptional, IsString, IsEnum, Length } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @Length(6, 50, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsNotEmpty({ message: 'El rol de usuario es obligatorio' })
  @IsEnum(UserRole, { message: 'El rol especificado es inválido' })
  role: UserRole;

  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres' })
  lastName?: string;
}
