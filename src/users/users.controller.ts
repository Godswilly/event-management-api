import { Controller, Get, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { ParseIdPipe } from './pipes/parse-int-id.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: number) {
    return this.usersService.update(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIdPipe) id: number) {
    return this.usersService.remove(id);
  }
}
