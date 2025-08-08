import { ConflictException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const entity = await this.usersRepository.save(createUserDto);
      return entity;
    } catch (error) {
      throw new ConflictException('user_already_created_with_email');
    }
  }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(id: string) {
    return this.usersRepository.findOne({
      where: {
        id,
      },
    });
  }

  async findOneByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({
      where: {
        email,
      },
    });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
