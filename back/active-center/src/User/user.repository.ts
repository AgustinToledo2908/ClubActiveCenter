/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/Entities/User.entity';
import { Repository } from 'typeorm';
import { RegisterUserDTO } from './UsersDTO/User.dto';

@Injectable()
export class UserRepository {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  async getAllUsers(): Promise<User[]> {
    const user: User[] = await this.userRepository.find();
    if(!user) throw new NotFoundException('No sé encontro ningún usuario');
    return user; 
  }

  async getUserById(id: string): Promise<User> {
    const user: User | null = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('El usuario buscado no existe.');
    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user: User | null = await this.userRepository.findOneBy({email});
    if(!user) throw new NotFoundException('Mail o contraseña incorrecta.');
    return user;
  }

  async registerUser(user: RegisterUserDTO): Promise<User> {
    return await this.userRepository.save(user);
  }
}
