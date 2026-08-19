import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BiometricCheckInDto {
  @ApiProperty({
    description: 'Imagen capturada por cámara en formato Base64',
    example: 'data:image/jpeg;base64,...',
  })
  @IsNotEmpty({ message: 'La imagen base64 es obligatoria' })
  @IsString({ message: 'La imagen debe ser una cadena base64 válida' })
  image: string;
}
