import { Injectable } from '@nestjs/common';
import {
  ActionRowBuilder,
  MessageFlags,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import {
  Context,
  MessageCommand,
  type MessageCommandContext,
  Modal,
  type ModalContext,
  ModalParam,
} from 'necord';

@Injectable()
export class EditCommand {
  @MessageCommand({
    name: 'Edit a Bot message',
    defaultMemberPermissions: 'Administrator',
  })
  async editMessage(@Context() [interaction]: MessageCommandContext) {
    const message = interaction.options.getMessage('message', true);

    if (message.author.id !== interaction.client.user?.id) {
      return interaction.reply({
        content: 'You can only edit messages sent by the bot.',
        ephemeral: true,
      });
    }

    const textInput = new TextInputBuilder()
      .setCustomId('content')
      .setLabel('Message Content')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(2000)
      .setValue(message.content || '');

    const attachmentsInput = new TextInputBuilder()
      .setCustomId('attachments')
      .setLabel('Attachments URLs (new line separated)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(2000)
      .setValue(
        message.attachments.size > 0
          ? Array.from(message.attachments.values())
              .map((att) => att.url)
              .join('\n')
          : '',
      );

    const modal = new ModalBuilder()
      .setCustomId(`editMessage/${message.id}`)
      .setTitle('Edit Bot Message')
      .addComponents([
        new ActionRowBuilder<TextInputBuilder>().addComponents(textInput),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          attachmentsInput,
        ),
      ]);

    await interaction.showModal(modal);
  }

  @Modal('editMessage/:messageId')
  async handleModalSubmit(
    @Context() [interaction]: ModalContext,
    @ModalParam('messageId') messageId: string,
  ) {
    const content = interaction.fields.getTextInputValue('content');
    const attachmentsInput =
      interaction.fields.getTextInputValue('attachments');
    const attachmentUrls = attachmentsInput
      .split(/[\n,]+/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    const attachments = attachmentUrls.map((url) => ({ attachment: url }));

    const message = await interaction.channel?.messages.fetch(messageId);
    if (!message) {
      return interaction.reply({
        content: 'Original message not found.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const editedMessage = await message.edit({ content, files: attachments });
    if (editedMessage) {
      return interaction.reply({
        content: 'Message edited successfully.',
        flags: MessageFlags.Ephemeral,
      });
    } else {
      return interaction.reply({
        content: 'Failed to edit the message.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
