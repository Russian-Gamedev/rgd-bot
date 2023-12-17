import { ApplyOptions } from '@sapphire/decorators';
import { ApiRequest, ApiResponse, methods, Route } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';
import * as process from 'process';

@ApplyOptions<Route.Options>({
  route: '/online',
})
export class OnlineRoute extends Route {
  private cache = {
    online: 0,
    members: 0,
  };
  private cacheNext = 0;

  public async [methods.GET](_request: ApiRequest, response: ApiResponse) {
    if (Date.now() - this.cacheNext > 0) {
      const invite =
        await this.container.client.application.guild.invites.fetch({
          code: process.env.RGD_INVITE_CODE,
        });

      this.cache.members = invite.memberCount;
      this.cache.online = invite.presenceCount;

      this.cacheNext = Date.now() + Time.Minute * 5;
    }

    response.json(this.cache);
  }
}
