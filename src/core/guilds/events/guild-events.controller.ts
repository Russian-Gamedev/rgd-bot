import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { GuildEvents, GuildEventsParameters } from '#config/guilds';
import { getActorUserId } from '#core/permissions/actor-user-id';
import { ApiActorAuth } from '#core/permissions/openapi-auth.decorator';
import { Actor } from '#core/permissions/permissions.decorator';
import { ActorAuthGuard } from '#core/permissions/permissions.guard';
import { type AuthenticatedActor } from '#core/permissions/permissions.types';
import { WalletService } from '#core/wallet/wallet.service';

import {
  AddEventResponseDto,
  CreateEventDto,
  GuildEventDto,
  GuildEventMessageDto,
  UpdateEventDto,
} from './dto/guild-event.dto';
import { GUILD_EVENT_COST } from './guild-events.constants';
import { GuildEventService } from './guild-events.service';

@ApiTags('Guild Events')
@Controller('events')
@UseGuards(ActorAuthGuard)
@ApiActorAuth()
export class GuildEventsController {
  constructor(
    private readonly guildEventService: GuildEventService,
    private readonly walletService: WalletService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get supported event names' })
  @ApiOkResponse({
    description: 'Array of event names.',
    schema: {
      items: { enum: Object.values(GuildEvents), type: 'string' },
      type: 'array',
    },
  })
  async getEventsList() {
    return Object.values(GuildEvents);
  }

  @Get('list')
  @ApiOperation({ summary: 'List configured event templates' })
  @ApiOkResponse({ type: [GuildEventDto] })
  async listEvents() {
    return this.guildEventService.listEvents();
  }

  @Get(':event')
  @ApiOperation({
    summary: 'Get a random message template for an event',
    description:
      'Extra query parameters are passed to the event template renderer.',
  })
  @ApiParam({ name: 'event', enum: GuildEvents })
  @ApiQuery({
    name: 'params',
    required: false,
    description:
      'Optional template parameters. Any query key is accepted by the renderer.',
    style: 'form',
  })
  @ApiOkResponse({ type: GuildEventMessageDto })
  @ApiNotFoundResponse({
    description: 'No templates found for the requested event.',
  })
  async getRandomEvent(
    @Param('event') event: string,
    @Query() params: Record<string, string>,
  ) {
    const eventTemplate = await this.guildEventService.getRandom(
      event as GuildEvents,
      params,
    );
    if (!eventTemplate)
      throw new NotFoundException(`No templates found for event "${event}"`);

    return { message: eventTemplate };
  }

  @Post()
  @ApiOperation({
    summary: 'Add an event template',
    description: `Adds an event template on behalf of the authenticated actor and debits ${GUILD_EVENT_COST} coins from their global wallet.`,
  })
  @ApiBody({ type: CreateEventDto })
  @ApiOkResponse({ type: AddEventResponseDto })
  async addEvent(
    @Actor() actor: AuthenticatedActor,
    @Body() dto: CreateEventDto,
  ) {
    const missingParams = GuildEventService.validateTemplate(
      dto.message,
      GuildEventsParameters[dto.event],
    );

    if (missingParams.length) {
      throw new BadRequestException(
        `The template is missing the following parameters: ${missingParams.join(', ')}`,
      );
    }

    const userId = getActorUserId(actor);
    const tx = await this.walletService.debit(
      userId,
      GUILD_EVENT_COST,
      'events:add',
    );
    const template = await this.guildEventService.addEvent(
      dto.event,
      dto.message,
      dto.attachments ?? null,
      BigInt(userId),
    );

    return {
      id: template.id,
      event: template.event,
      message: template.message,
      attachments: template.attachments,
      author: template.author,
      balance_after: tx.balance_after.toString(),
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an event template',
    description: 'Only the author of the template can update it.',
  })
  @ApiBody({ type: UpdateEventDto })
  @ApiOkResponse({ type: GuildEventDto })
  @ApiNotFoundResponse({ description: 'Event template not found.' })
  async updateEvent(
    @Actor() actor: AuthenticatedActor,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    const authorId = BigInt(getActorUserId(actor));
    const updated = await this.guildEventService.updateEvent(id, dto, authorId);
    if (!updated) throw new NotFoundException('Event template not found');
    return updated;
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an event template',
    description: 'Only the author of the template can delete it.',
  })
  @ApiNotFoundResponse({ description: 'Event template not found.' })
  async removeEvent(
    @Actor() actor: AuthenticatedActor,
    @Param('id') id: string,
  ) {
    const authorId = BigInt(getActorUserId(actor));
    const removed = await this.guildEventService.removeEvent(id, authorId);
    if (!removed) throw new NotFoundException('Event template not found');
    return { removed };
  }
}
