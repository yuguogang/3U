import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { type User } from '@/db';
import { JwtAuthGuard } from '@/auth';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@CurrentUser() user: User) {
    return this.userService.findClientProfileById(user.id);
  }
}
