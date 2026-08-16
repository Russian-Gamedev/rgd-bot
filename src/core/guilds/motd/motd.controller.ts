import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { getActorUserId } from '#core/permissions/actor-user-id';
import { ApiActorAuth } from '#core/permissions/openapi-auth.decorator';
import { Actor } from '#core/permissions/permissions.decorator';
import { ActorAuthGuard } from '#core/permissions/permissions.guard';
import { type AuthenticatedActor } from '#core/permissions/permissions.types';
import { WalletService } from '#core/wallet/wallet.service';

import {
  AddMotdResponseDto,
  CreateMotdDto,
  CurrentMotdResponseDto,
  MotdDto,
} from './dto/motd.dto';
import { MOTD_COST } from './motd.constants';
import { MotdService } from './motd.service';

@ApiTags('MOTD')
@Controller('motd')
export class MotdController {
  constructor(
    private readonly motdService: MotdService,
    private readonly walletService: WalletService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current message of the day' })
  @ApiOkResponse({ type: CurrentMotdResponseDto })
  async getCurrentMotd() {
    const motd = await this.motdService.getCurrentMotd();
    return { motd };
  }

  @Get('list')
  @UseGuards(ActorAuthGuard)
  @ApiActorAuth()
  @ApiOperation({ summary: 'List configured messages of the day' })
  @ApiOkResponse({ type: [MotdDto] })
  async listMotds() {
    return this.motdService.listMotds();
  }

  @Post()
  @UseGuards(ActorAuthGuard)
  @ApiActorAuth()
  @ApiOperation({
    summary: 'Add your own MOTD',
    description: `Adds a MOTD on behalf of the authenticated actor and debits ${MOTD_COST} coins from their global wallet. The payment is guild-agnostic.`,
  })
  @ApiBody({ type: CreateMotdDto })
  @ApiOkResponse({ type: AddMotdResponseDto })
  async addMotd(
    @Actor() actor: AuthenticatedActor,
    @Body() dto: CreateMotdDto,
  ) {
    const userId = getActorUserId(actor);
    const tx = await this.walletService.debit(userId, MOTD_COST, 'motd:add');
    const motd = await this.motdService.addMotd(dto.content, BigInt(userId));
    return {
      id: motd.id,
      content: motd.content,
      balance_after: tx.balance_after.toString(),
    };
  }
}
