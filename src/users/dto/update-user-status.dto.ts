import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @IsNotEmpty({ message: 'El estado activo/inactivo es obligatorio' })
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  isActive: boolean;
}
