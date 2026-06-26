import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'jeroky_soft_secret_key_2026_change_me',
      ),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.usersService.findOneById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no válido o inactivo');
    }
    return user;
  }
}
