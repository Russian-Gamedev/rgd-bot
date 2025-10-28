import { type BaseImageURLOptions, GuildMember } from 'discord.js';
import { MemberOption, StringOption } from 'necord';

export class MemberDto {
  @MemberOption({
    name: 'member',
    description: 'Select a member',
    required: false,
  })
  member: GuildMember | null;

  @StringOption({
    name: 'ext',
    description: 'Image format (png, jpg, webp, gif)',
    required: false,
  })
  extension: BaseImageURLOptions['extension'] = 'webp';
}
