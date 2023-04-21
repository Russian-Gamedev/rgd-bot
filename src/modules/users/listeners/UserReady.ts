import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { ROLE_IDS } from '@/configs/discord-constants';
import { EmbedBuilder, Events, type EmbedField } from 'discord.js';
import { User } from '@/lib/directus/directus-entities/User';
import { FilterRule } from '@/lib/directus/directus-orm/filters';
import cron from 'node-cron';

@ApplyOptions<Listener.Options>({ once: true, event: Events.ClientReady })
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  run() {
    cron.schedule('0 8 * * *', this.birthDayCron.bind(this));
    setTimeout(() => this.birthDayCron().catch(console.error), 5000);
  }

  private async birthDayCron() {
    const membersBirthday = await container.rgd.roles
      .fetch(ROLE_IDS.BIRTHDAY)
      .then((role) => role.members);
    for (const [, member] of membersBirthday) {
      await member.roles.remove(ROLE_IDS.BIRTHDAY);
    }

    const today = new Date()
      .toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })
      .replace('/', '-');

    const data = await User.find({
      filter: new FilterRule().EndsWith('birthDate', today),
    });

    const embed = new EmbedBuilder();
    embed.setDescription('СЕГОДНЯШНИЕ ИМЕНИННИКИ');
    embed.setFooter({ text: 'поздравьте их' });

    const field: EmbedField = {
      value: '',
      name: 'и вот их список',
      inline: false,
    };

    for (const user of data) {
      const [year] = user.birthDate.split('-');
      const yearsOld = new Date().getFullYear() - Number(year);
      field.value += `<@${user.id}> сегодня празднует свое ${yearsOld} летие\n`;
      try {
        const member = await container.rgd.members.fetch(user.id);
        await member.roles.add(ROLE_IDS.BIRTHDAY);
      } catch (e) {
        container.logger.info(user.username + ' not on server');
      }
    }

    if (field.value.length === 0) return;

    embed.setFields([field]);

    await container.mainChannel.send({ embeds: [embed] });
  }
}
