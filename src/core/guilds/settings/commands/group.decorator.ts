import { InteractionContextType } from 'discord.js';
import { createCommandGroupDecorator } from 'necord';

export const SettingsCommandDecorator = createCommandGroupDecorator({
  name: 'settings',
  description: 'Guild settings commands',
  defaultMemberPermissions: 'Administrator',
  contexts: [InteractionContextType.Guild],
});
