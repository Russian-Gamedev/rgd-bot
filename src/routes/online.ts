import { ApplyOptions } from '@sapphire/decorators';
import { ApiRequest, ApiResponse, methods, Route } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';

import { RGD_SERVER_ID } from '@/configs/constants';

@ApplyOptions<Route.Options>({
  route: '/online',
})
export class OnlineRoute extends Route {
  private cache = {
    online: 0,
    total: 0,
  };
  private cacheNext = 0;

  public async [methods.GET](_request: ApiRequest, response: ApiResponse) {
    if (Date.now() - this.cacheNext > 0) {
      const server = await this.container.client.guilds.fetch(RGD_SERVER_ID);
      this.cache.total = server.members.cache.size;
      this.cache.online = server.members.cache.filter(
        (member) => (member?.presence?.status ?? 'offline') != 'offline',
      ).size;
      this.cacheNext = Date.now() + Time.Minute * 5;
    }

    response.json(this.cache);
  }
}
