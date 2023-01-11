import type { ILogger } from '@sapphire/framework';
import { LogLevel } from '@sapphire/framework';
import axios from 'axios';
import { ColorResolvable, MessageEmbed } from 'discord.js';

export class DiscordLogger implements ILogger {
  private messageBuffer: Array<{
    level: LogLevel;
    values: readonly unknown[];
  }> = [];

  constructor() {
    setInterval(() => {
      if (this.messageBuffer.length > 0) {
        const msg = this.messageBuffer.shift();
        this.sendToDiscord(msg);
      }
    }, 1000);
  }

  private async sendToDiscord({ level, values }: typeof this.messageBuffer[0]) {
    const colors: Record<LogLevel, ColorResolvable> = {
      [LogLevel.Debug]: '#9c05fa',
      [LogLevel.Error]: '#fa0505',
      [LogLevel.Fatal]: '#eb4034',
      [LogLevel.Info]: '#3474eb',
      [LogLevel.Trace]: '#89eb34',
      [LogLevel.Warn]: '#ebe534',
      [LogLevel.None]: '#a4a4a4',
    };

    const embed = new MessageEmbed();
    embed.setColor(colors[level]);
    embed.setDescription(values.join(' '));
    try {
      await axios.post(process.env.DISCORD_LOGGER_WEBHOOK, {
        content: '',
        embeds: [embed.toJSON()],
      });
    } catch (e: any) {
      console.log(e.response.data.message);
    }
  }

  public debug(...values: readonly unknown[]): void {
    this.write(LogLevel.Debug, ...values);
  }

  public error(...values: readonly unknown[]): void {
    this.write(LogLevel.Error, ...values);
  }

  public fatal(...values: readonly unknown[]): void {
    this.write(LogLevel.Fatal, ...values);
  }

  public has(): boolean {
    return false;
  }

  public info(...values: readonly unknown[]): void {
    this.write(LogLevel.Info, ...values);
  }

  public trace(...values: readonly unknown[]): void {
    this.write(LogLevel.Trace, ...values);
  }

  public warn(...values: readonly unknown[]): void {
    this.write(LogLevel.Warn, ...values);
  }

  public write(level: LogLevel, ...values: readonly unknown[]) {
    this.messageBuffer.push({ level, values });
  }
}
