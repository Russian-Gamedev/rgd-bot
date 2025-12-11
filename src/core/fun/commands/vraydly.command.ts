import { Injectable, Logger } from '@nestjs/common';
import { files } from 'jszip';
import { Context, MessageCommand, type MessageCommandContext } from 'necord';

@Injectable()
export class VryadliCommand {
  private readonly logger = new Logger(VryadliCommand.name);
  private files: string[] = [];

  async onModuleInit() {
    const baseUrl = 'https://assets.rgd.chat/vryadli/';

    const html = await fetch(baseUrl).then((res) => res.text());
    const regex = /href="(.*?)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const fileName = match[1];
      if (fileName.endsWith('.webp')) {
        this.files.push(baseUrl + fileName);
      }
    }

    this.logger.log(`Loaded ${this.files.length} images.`);
  }

  @MessageCommand({
    name: 'Врядли',
  })
  onMessage(@Context() [interaction]: MessageCommandContext) {
    const randomIndex = Math.floor(Math.random() * this.files.length);
    const imageUrl = this.files[randomIndex];

    return interaction.reply({
      files: [imageUrl],
    });
  }
}
