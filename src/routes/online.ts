import { ApplyOptions } from '@sapphire/decorators';
import { ApiRequest, ApiResponse, methods, Route } from '@sapphire/plugin-api';
import { Time } from '@sapphire/time-utilities';

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
      const response = await fetch(
        'https://discord.com/api/v9/invites/5kZhhWD?with_counts=true',
      ).then((res) => res.json());

      this.cache.online = response.approximate_member_count;
      this.cache.members = response.approximate_presence_count;

      this.cacheNext = Date.now() + Time.Minute * 5;
    }

    response.json(this.cache);
  }
}
