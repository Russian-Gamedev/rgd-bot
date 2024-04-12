import { ApplyOptions } from '@sapphire/decorators';
import { ApiRequest, ApiResponse, methods, Route } from '@sapphire/plugin-api';

import { pickRandom } from '#base/lib/utils';

const motd = [
  'Проклятая водянка',
  'Видюха и воришка',
  'Дядя и дота',
  'Поясничная хворь',
  'Майнкрафт на ультрах не сказка',
  'Изгнанный из турции',
  'Король Десяти Тронов',
  'Дурак и тротлинг',
  'Прыгну во штаны',
  'Куколд колдуньи',
];

@ApplyOptions<Route.Options>({
  route: '/',
})
export class RootRoute extends Route {
  public async [methods.GET](_request: ApiRequest, response: ApiResponse) {
    response.json({ motd: pickRandom(motd) });
  }
}
