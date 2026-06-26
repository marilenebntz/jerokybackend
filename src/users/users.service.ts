import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findOneById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(
    email: string,
    passwordPlain: string,
    role: UserRole,
    firstName?: string,
    lastName?: string,
  ): Promise<User> {
    const existing = await this.findOneByEmail(email);
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(passwordPlain, 10);
    const user = this.userRepository.create({
      email,
      passwordHash,
      role,
      firstName,
      lastName,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async updateUserRole(id: string, role: UserRole): Promise<User> {
    const user = await this.findOneById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.role = role;
    return this.userRepository.save(user);
  }
}
