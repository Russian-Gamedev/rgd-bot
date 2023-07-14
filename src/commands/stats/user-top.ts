import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry } from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { EmbedBuilder } from 'discord.js';

import { Colors } from '@/configs/constants';
import { EmojiMedals } from '@/configs/emojies';
import { User } from '@/lib/database/entities';
import { formatTime } from '@/lib/utils';

const medals = [EmojiMedals.First, EmojiMedals.Second, EmojiMedals.Third];

@ApplyOptions<Subcommand.Options>({
  name: 'top',
  description: 'Топы среди сервера',
  subcommands: [
    { name: 'voice', chatInputRun: 'chatInputVoice' },
    { name: 'chat', chatInputRun: 'chatInputChat' },
    { name: 'rep', chatInputRun: 'chatInputRep' },
    { name: 'coin', chatInputRun: 'chatInputCoin' },
  ],
})
export class VoiceTopCommand extends Subcommand {
  override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addSubcommand((input) =>
            input
              .setName('voice')
              .setDescription('Топ юзеров по времни в войсе'),
          )
          .addSubcommand((input) =>
            input
              .setName('chat')
              .setDescription('Топ юзеров по активности в чате'),
          )
          .addSubcommand((input) =>
            input.setName('rep').setDescription('Уважаемые люди'),
          )
          .addSubcommand((input) =>
            input.setName('coin').setDescription('Богатые люди'),
          ),
      { idHints: ['1129051461632938054'] },
    );
  }

  async chatInputVoice(intereaction: Subcommand.ChatInputCommandInteraction) {
    const users = await User.find({ order: { voiceTime: -1 }, take: 10 });

    const embed = this.buildTop(
      'Топ по времени в войсе',
      users,
      ({ voiceTime }) => formatTime(voiceTime),
    );

    return intereaction.reply({ embeds: [embed] });
  }

  async chatInputChat(intereaction: Subcommand.ChatInputCommandInteraction) {
    const users = await User.find({ order: { experience: -1 }, take: 10 });

    const embed = this.buildTop(
      'Топ активности в чате',
      users,
      ({ experience }) => experience.toLocaleString('ru'),
    );

    return intereaction.reply({ embeds: [embed] });
  }

  async chatInputCoin(intereaction: Subcommand.ChatInputCommandInteraction) {
    const users = await User.find({ order: { coins: -1 }, take: 10 });

    const embed = this.buildTop('Топ по деньгам', users, ({ coins }) =>
      coins.toLocaleString('ru'),
    );

    embed.setColor(0xfeeb04);

    return intereaction.reply({ embeds: [embed] });
  }
  async chatInputRep(intereaction: Subcommand.ChatInputCommandInteraction) {
    const users = await User.find({ order: { reputation: -1 }, take: 10 });

    const embed = this.buildTop(
      'Топ по уважению',
      users,
      ({ reputation }) => reputation,
    );

    return intereaction.reply({ embeds: [embed] });
  }

  private buildTop(
    name: string,
    users: User[],
    value: (user: User) => string | number,
  ) {
    let column = '';

    for (const user of users) {
      const index = users.indexOf(user);
      const pos = medals[index] ?? `${index + 1}.`;

      column += `${pos} <@${user.id}>: \`${value(user)}\` \n`;
    }

    const embed = new EmbedBuilder();
    embed.setColor(Colors.Primary);
    embed.setFields({
      name,
      value: column,
      inline: true,
    });

    return embed;
  }
}
