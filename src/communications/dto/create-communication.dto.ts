import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayNotEmpty,
  Length,
} from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class CreateCommunicationDto {
  @IsNotEmpty({ message: 'El asunto es obligatorio' })
  @IsString({ message: 'El asunto debe ser texto' })
  @Length(1, 250, { message: 'El asunto no puede exceder los 250 caracteres' })
  subject: string;

  @IsNotEmpty({ message: 'El cuerpo es obligatorio' })
  @IsString({ message: 'El cuerpo debe ser texto' })
  @Length(1, 2000, {
    message: 'El cuerpo no puede exceder los 2000 caracteres',
  })
  body: string;

  @IsArray({ message: 'Los roles objetivo deben ser un arreglo' })
  @ArrayNotEmpty({ message: 'Debe especificar al menos un rol objetivo' })
  targetRoles: UserRole[];

  @IsArray({ message: 'Los canales de comunicación deben ser un arreglo' })
  @ArrayNotEmpty({ message: 'Debe especificar al menos un canal' })
  channels: string[]; // 'Web', 'Email'
}
