import { ApplyOptions } from '@sapphire/decorators';
import {
  CommandOptions,
  CommandOptionsRunTypeEnum,
  ChatInputCommand,
  Command,
  container,
} from '@sapphire/framework';
import { BaseCommand } from '../lib/sapphire/base-command';
import { replyWithError } from '../lib/helpers/sapphire';
import type { TextChannel } from 'discord.js';
import { RoleBindings } from '../lib/services/entities/Discord';

const enum OPTIONS {
  Message = 'message',
  Role = 'role',
  Emoji = 'emoji',
  Channel = 'channel',
}

const enum Permission {
  Ban = 1 << 2,
}

@ApplyOptions<CommandOptions>({
  description: 'Привязать роль к эмодзи',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export class RoleBindingsCommand extends BaseCommand {
  override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(Permission.Ban)
        .addStringOption((option) =>
          option
            .setName(OPTIONS.Message)
            .setDescription('id сообщения')
            .setRequired(true),
        )
        .addRoleOption((option) =>
          option
            .setName(OPTIONS.Role)
            .setDescription('Выдаваемая роль')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName(OPTIONS.Emoji)
            .setDescription('Эмодзи')
            .setRequired(true),
        )
        .addChannelOption((option) =>
          option
            .setName(OPTIONS.Channel)
            .setDescription('Канал в котором сообщение')
            .setRequired(false),
        ),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputInteraction,
  ) {
    let channel = interaction.options.getChannel(
      OPTIONS.Channel,
      false,
    ) as TextChannel;
    if (!channel) {
      channel = (await container.rgd.channels.fetch(
        interaction.channelId,
      )) as TextChannel;
    }
    const message = await channel.messages.fetch(
      interaction.options.get(OPTIONS.Message).value as string,
    );
    const role = interaction.options.getRole(OPTIONS.Role);
    const emojiRaw = interaction.options.get(OPTIONS.Emoji).value.toString();

    if (message && role && emojiRaw) {
      let emoji = emojiRaw.match(/\d/g)?.join('') || emojiRaw;
      if (emoji.length == 1) {
        if (!isNaN(+emoji)) {
          emoji = `${emoji}️⃣`;
        }
      }

      const bindings = await RoleBindings.create({
        role: role.id,
        emoji,
        message: message.id,
      });
      await bindings.save();

      await message.react(emojiRaw);

      RoleBindings.list = await RoleBindings.find(true);

      return interaction.reply({
        ephemeral: true,
        content: `<@&${role.id}> привязан ${emojiRaw} `,
      });
    }

    return replyWithError(
      interaction,
      'Ни канал ни пользователь не был указан',
    );
  }
}
