import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiPermanentRedirectResponse,
  ApiTags,
  OmitType,
} from '@nestjs/swagger';
import {
  GameListQueryDto,
  GameListResponseDto,
} from '#core/games/dto/games.dto';
import { GamesService } from '#core/games/games.service';
import { type Response } from 'express';
import { getActorUserId } from '#core/permissions/actor-user-id';
import { ApiActorAuth } from '#core/permissions/openapi-auth.decorator';
import { Actor } from '#core/permissions/permissions.decorator';
import { ActorAuthGuard } from '#core/permissions/permissions.guard';
import { type AuthenticatedActor } from '#core/permissions/permissions.types';
import { replaceImageExtension } from '#lib/utils/discord';

import { CurrentUserProfileDto } from './dto/current-user-profile.dto';
import { PatchCurrentUserProfileDto } from './dto/patch-current-user-profile.dto';
import { PublicUserProfileDto } from './dto/public-user-profile.dto';
import { PublicProfileService } from './public-profile.service';
import { UserService } from './users.service';

class UserGamesQueryDto extends OmitType(GameListQueryDto, [
  'author_id',
] as const) {}

const AVATAR_EXTENSIONS = new Set(['png', 'webp', 'gif']);

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly publicProfileService: PublicProfileService,
    private readonly gamesService: GamesService,
  ) {}

  @Get('me')
  @UseGuards(ActorAuthGuard)
  @ApiActorAuth()
  @ApiOperation({
    summary: 'Get current user profile and permissions',
    description:
      'Accepts a user JWT from cookie/header or a linked bot bearer token. Unlinked bot tokens are rejected.',
  })
  @ApiOkResponse({ type: CurrentUserProfileDto })
  @ApiBadRequestResponse({
    description: 'Bot token is not linked to a Discord profile.',
  })
  @ApiNotFoundResponse({ description: 'User profile was not found.' })
  async getMe(@Actor() actor: AuthenticatedActor) {
    const userId = getActorUserId(actor);
    return this.publicProfileService.getCurrentUserProfile(userId, actor);
  }

  @Patch('me')
  @UseGuards(ActorAuthGuard)
  @ApiActorAuth()
  @ApiOperation({
    summary: 'Update current user profile information',
    description:
      'Accepts a user JWT from cookie/header or a linked bot bearer token. Missing fields are preserved; null clears nullable fields.',
  })
  @ApiBody({ type: PatchCurrentUserProfileDto })
  @ApiOkResponse({ type: CurrentUserProfileDto })
  @ApiBadRequestResponse({
    description: 'Bot token is not linked to a Discord profile.',
  })
  async patchMe(
    @Actor() actor: AuthenticatedActor,
    @Body() dto: PatchCurrentUserProfileDto,
  ): Promise<CurrentUserProfileDto> {
    const userId = getActorUserId(actor);
    const profile = await this.userService.updateProfileInfo(userId, dto);
    await this.publicProfileService.invalidateProfileCache(profile);
    return this.publicProfileService.getCurrentUserProfile(userId, actor);
  }

  @Get(':id_or_username/games')
  @ApiOperation({
    summary: 'Get published games by user',
    description:
      'Looks up a user profile by Discord ID or username and returns games owned or authored by that Discord user.',
  })
  @ApiParam({
    name: 'id_or_username',
    description: 'Discord user ID or username.',
    example: '123456789012345678',
  })
  @ApiOkResponse({ type: GameListResponseDto })
  @ApiNotFoundResponse({ description: 'User profile was not found.' })
  async getGames(
    @Param('id_or_username') lookup: string,
    @Query() query: UserGamesQueryDto,
  ) {
    const profile = await this.userService.lookupProfile(lookup);
    if (!profile) {
      throw new NotFoundException('User profile was not found.');
    }
    return this.gamesService.listByUser(profile.user_id.toString(), query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get public user profile or redirect to avatar',
    description:
      'Looks up a user profile by Discord ID or username. When the lookup ends with .png, .webp or .gif, redirects to the user avatar image instead.',
  })
  @ApiParam({
    name: 'id',
    description: 'Discord user ID or username.',
    example: '123456789012345678',
  })
  @ApiOkResponse({ type: PublicUserProfileDto })
  @ApiPermanentRedirectResponse({
    description:
      'Redirects to the user avatar URL when the lookup ends with an image extension.',
  })
  @ApiNotFoundResponse({ description: 'User profile was not found.' })
  async getById(@Param('id') id: string, @Res() res: Response) {
    const ext = id.split('.').at(-1);
    if (ext && AVATAR_EXTENSIONS.has(ext)) {
      const lookup = id.slice(0, id.length - ext.length - 1);
      const profile = await this.publicProfileService.getPublicProfile(lookup);
      return res.redirect(308, replaceImageExtension(profile.avatarUrl, ext));
    }

    const profile = await this.publicProfileService.getPublicProfile(id);
    return res.json(profile);
  }
}
