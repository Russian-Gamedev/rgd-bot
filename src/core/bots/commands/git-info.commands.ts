import { Injectable } from '@nestjs/common';
import { Client } from 'discord.js';
import { Context, Once, SlashCommand, type SlashCommandContext } from 'necord';

import { GitInfoService } from '#common/git-info.service';
import { Colors } from '#config/constants';

@Injectable()
export class GitInfoCommands {
  constructor(
    private readonly gitInfoService: GitInfoService,
    private readonly discord: Client,
  ) {}

  @SlashCommand({
    name: 'version',
    description: 'Show bot version and git information',
  })
  public async onVersion(@Context() [interaction]: SlashCommandContext) {
    const embed = this.getEmbed();
    return interaction.reply({ embeds: [embed] });
  }

  @Once('clientReady')
  async onReady() {
    if (process.env.NODE_ENV === 'development') return;

    const embed = this.getEmbed();

    /// TODO: send to config channel
    const channel = await this.discord.channels.fetch(
      process.env.DEBUG_CHANNEL_ID!,
    );
    if (channel?.isSendable()) {
      await channel.send({ embeds: [embed] });
    }
  }

  private getEmbed() {
    const gitInfo = this.gitInfoService.getGitInfo();

    return {
      title: '🤖 Bot Version Information',
      color: Colors.Primary,
      fields: [
        {
          name: '🌿 Branch',
          value: `[\`${gitInfo.branch}\`](${gitInfo.branchLink})`,
          inline: true,
        },
        {
          name: '📝 Commit',
          value: `[\`${gitInfo.shortCommit}\`](${gitInfo.commitLink})`,
          inline: true,
        },
        {
          name: '🔗 Repository',
          value: `[Russian-Gamedev/rgd-bot](https://github.com/Russian-Gamedev/rgd-bot)`,
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }
}
