import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CurrentMotdResponseDto {
  @ApiProperty({ example: 'Добро пожаловать в RGD!', nullable: true })
  motd: string | null;
}

export class MotdAuthorDto {
  @ApiProperty({ example: 'damir' })
  username: string;

  @ApiProperty({ example: 'https://cdn.discordapp.com/avatars/...' })
  avatar_url: string;

  @ApiProperty({ example: '123456789012345678' })
  id: string;
}

export class MotdDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Добро пожаловать в RGD!' })
  content: string;

  @ApiProperty({ type: MotdAuthorDto })
  user: MotdAuthorDto;
}

export class CreateMotdDto {
  @ApiProperty({
    example: 'Добро пожаловать в RGD!',
    description: 'Текст MOTD',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  content: string;
}

export class AddMotdResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Добро пожаловать в RGD!' })
  content: string;

  @ApiProperty({
    description: 'Баланс кошелька после списания стоимости MOTD.',
  })
  balance_after: string;
}
