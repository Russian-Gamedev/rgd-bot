import { Guild, TextChannel } from 'discord.js';

declare module '@sapphire/pieces' {
  interface Container {
    rgd: Guild;
    mainChannel: TextChannel;
    debugChannel: TextChannel;
  }
}
