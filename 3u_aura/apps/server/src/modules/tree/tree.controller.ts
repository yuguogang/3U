import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { User } from '@/db';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BindPlacementDto } from './dto';
import { TreeTopologyService } from './services/tree-topology.service';

@Controller('tree')
@UseGuards(JwtAuthGuard)
export class TreeController {
  constructor(private readonly treeTopologyService: TreeTopologyService) {}

  @Get('placement/selectable-slots')
  async getSelectableSlots(@CurrentUser() user: User) {
    return this.treeTopologyService.listSelectableSlotsForInviter(user);
  }

  @Post('placement/bind')
  @HttpCode(HttpStatus.OK)
  async bindPlacement(
    @CurrentUser() user: User,
    @Body() body: BindPlacementDto,
  ) {
    return this.treeTopologyService.bindPlacementForInviter(user, body);
  }
}
