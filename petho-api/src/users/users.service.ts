import { Injectable, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    const adminCount = await this.usersRepository.count({ where: { role: UserRole.ADMIN } });
  
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL;
      const username = process.env.ADMIN_USERNAME;
      const password = process.env.ADMIN_PASSWORD;
  
      if (!email || !username || !password) {
        throw new Error('ADMIN_EMAIL, ADMIN_USERNAME y ADMIN_PASSWORD son requeridos en el .env');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const admin = this.usersRepository.create({
        email,
        username,
        password: hashedPassword,
        role: UserRole.ADMIN,
        is_active: true,
      });
  
      await this.usersRepository.save(admin);
    }
  }
  

  async create(createUserDto: CreateUserDto): Promise<Partial<User>> {
    const existingEmail = await this.usersRepository.findOne({ where: { email: createUserDto.email } });
    if (existingEmail) {
      throw new ConflictException('El correo ya está registrado');
    }

    const existingUsername = await this.usersRepository.findOne({ where: { username: createUserDto.username } });
    if (existingUsername) {
      throw new ConflictException('El usuario ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      // Todos nacen inactivos y como LECTOR por defecto por seguridad
      is_active: false,
      role: UserRole.LECTOR,
    });

    const saved = await this.usersRepository.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async findAll(): Promise<Partial<User>[]> {
    const users = await this.usersRepository.find({
      order: { id: 'ASC' },
    });
    return users.map(user => {
      const { password, ...result } = user;
      return result;
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<Partial<User>> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    const updated = await this.usersRepository.save(user);
    const { password, ...result } = updated;
    return result;
  }
}
