import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { EmbedBuilder, EmbedField } from 'discord.js';
import { Like } from 'typeorm';

import { ROLE_IDS } from '@/configs/constants';
import { User } from '@/lib/database/entities';

@ApplyOptions({
  name: 'birthday-task',
  pattern: '0 8 * * *',
})
export class BirthdayTask extends ScheduledTask {
  async run() {
    const membersBirthday = await this.container.rgd.roles
      .fetch(ROLE_IDS.BIRTHDAY)
      .then((role) => role?.members);

    if (membersBirthday) {
      for (const member of membersBirthday.values()) {
        await member.roles.remove(ROLE_IDS.BIRTHDAY);
      }
    }

    const today = new Date()
      .toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })
      .replace('/', '-');

    const users = await User.find({
      where: {
        birthDate: Like(`%-${today}`),
      },
    });

    if (users.length === 0) return;

    const embed = new EmbedBuilder();
    embed.setDescription('СЕГОДНЯШНИЕ ИМЕНИННИКИ');
    embed.setFooter({ text: 'поздравьте их' });

    const field: EmbedField = {
      value: '',
      name: 'и вот их список',
      inline: false,
    };

    for (const user of users) {
      const [year] = user.birthDate.split('-');
      const yearsOld = new Date().getFullYear() - Number(year);
      field.value += `<@${user.id}> сегодня празднует свое ${yearsOld} летие\n`;
      try {
        const member = await this.container.rgd.members.fetch(user.id);
        await member.roles.add(ROLE_IDS.BIRTHDAY);
      } catch (e) {
        this.container.logger.info(user.username + ' not at server');
      }
    }

    embed.setFields([field]);

    await this.container.mainChannel.send({ embeds: [embed] });
  }
}
