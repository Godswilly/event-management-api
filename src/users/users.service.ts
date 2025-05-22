import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const { username, email, password, role } = createUserDto;

    // Only allow ADMIN to be set manually
    if (role && role !== Role.ADMIN) {
      throw new BadRequestException(
        'Only ADMIN role can be explicitly assigned. Behavioral roles are inferred.',
      );
    }

    return this.prisma.user.create({
      data: {
        username,
        email,
        password,
        role: role ?? null,
      },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);

    return this.prisma.user.update({
      where: { id: user.id },
      data: updateUserDto,
    });
  }

  async remove(id: number) {
    const user = await this.findById(id);

    return this.prisma.user.delete({
      where: { id: user.id },
    });
  }
}
