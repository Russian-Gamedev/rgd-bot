import { Ctx, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class TelegramUpdate {
  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply(
      'Добро пожаловать в RGD Bot!\n\nЭтот бот ничего не делает :)',
    );
  }
}
