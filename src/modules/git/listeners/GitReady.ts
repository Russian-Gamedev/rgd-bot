import { exec } from 'child_process';
import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { EmbedBuilder } from 'discord.js';
import { LocalStorage } from '@/lib/LocalStorage';

type Commit = {
  hash: string;
  type: string;
  subject: string;
};

@ApplyOptions<Listener.Options>({ once: true, event: Events.ClientReady })
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  async run() {
    const lastCommit = LocalStorage.getItem('last-commit');
    const currentCommit = await this.execAsync('git rev-parse --short HEAD');
    if (lastCommit == currentCommit) return;

    const commitCount = await this.execAsync('git rev-list --count HEAD');
    const commitsBetween = await this.execAsync(
      `git log --oneline ${lastCommit}..${currentCommit}`,
    );

    LocalStorage.setItem('last-commit', currentCommit);

    const embed = this.buildEmbed(this.parseCommits(commitsBetween));
    embed.setTitle('Версия: ' + commitCount);

    await this.container.debugChannel.send({ embeds: [embed] });
  }

  private buildEmbed(commits: Commit[]) {
    const embed = new EmbedBuilder();

    const themes = new Map<string, Commit[]>();
    const themesText: Record<string, string> = {
      feat: 'Нововведения',
      fix: 'Фиксы',
      refactor: 'Рефакторинг',
      chore: 'Черновая работа',
    };

    for (const commit of commits) {
      if (!themes.has(commit.type)) {
        themes.set(commit.type, []);
      }
      themes.get(commit.type).push(commit);
    }

    const buildMessage = (commit: Commit) => {
      return `\`${commit.hash}\` ${commit.subject}`;
    };

    for (const [key, commits] of themes) {
      embed.addFields({
        name: themesText[key],
        value: commits.map(buildMessage).join('\n'),
      });
    }

    return embed;
  }

  private parseCommits(gitlog: string) {
    const regex = /(?<hash>[a-z0-9]{7}) (?<type>.*): (?<subject>.*)/m;
    const commits: Commit[] = [];
    const lines = gitlog.split('\n');
    for (const line of lines) {
      if (!line) continue;
      const { hash, type, subject } = regex.exec(line).groups;
      commits.push({ hash, type, subject });
    }
    return commits;
  }

  private execAsync(command: string) {
    return new Promise<string>((res) => {
      exec(command, (_err, stdout) => {
        res(stdout);
      });
    });
  }
}
