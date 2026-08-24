import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { GuildEvents } from '#config/guilds';

export class CreateEventDto {
  @ApiProperty({ enum: GuildEvents })
  @IsEnum(GuildEvents)
  event: GuildEvents;

  @ApiProperty({
    example: 'Прощай, ${user}!',
    description: 'Шаблон сообщения события',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  message: string;

  @ApiProperty({
    type: [String],
    required: false,
    example: ['https://cdn.discordapp.com/attachments/...'],
  })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

export class UpdateEventDto {
  @ApiProperty({
    example: 'Прощай, ${user}!',
    description: 'Новый шаблон сообщения события',
    maxLength: 2000,
  })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  message?: string;

  @ApiProperty({
    type: [String],
    required: false,
    example: ['https://cdn.discordapp.com/attachments/...'],
  })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

export class GuildEventAuthorDto {
  @ApiProperty({ example: '123456789012345678' })
  id: string;

  @ApiProperty({ example: 'damir' })
  username: string;

  @ApiProperty({ example: 'https://cdn.discordapp.com/avatars/...' })
  avatar_url: string;
}

export class GuildEventDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: GuildEvents })
  event: GuildEvents;

  @ApiProperty({ example: 'Прощай, ${user}!' })
  message: string;

  @ApiProperty({ type: [String], nullable: true })
  attachments: string[] | null;

  @ApiProperty({
    type: GuildEventAuthorDto,
    description: 'Автор, оплативший создание шаблона.',
  })
  author: GuildEventAuthorDto;
}

export class AddEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: GuildEvents })
  event: GuildEvents;

  @ApiProperty({ example: 'Прощай, ${user}!' })
  message: string;

  @ApiProperty({ type: [String], nullable: true })
  attachments: string[] | null;

  @ApiProperty({ type: GuildEventAuthorDto })
  author: GuildEventAuthorDto;

  @ApiProperty({
    description: 'Баланс кошелька после списания стоимости события.',
  })
  balance_after: string;
}

export class GuildEventMessageDto {
  @ApiProperty({ example: 'Прощай, ${user}!' })
  message: string;
}

export class UpdateEventParamsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id: string;
}
