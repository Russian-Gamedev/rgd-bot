import { Injectable } from '@nestjs/common';
import { Context, type ContextOf, On } from 'necord';

@Injectable()
export class FunService {
  @On('messageCreate')
  async handleClownMessage(@Context() [message]: ContextOf<'messageCreate'>) {
    if (
      message.content.includes('https://director-gamedeva.itch.io/bibizyana')
    ) {
      await message.react('🤡');
    }
  }
}
