import { ApplyOptions } from '@sapphire/decorators';
import { ApiRequest, ApiResponse, methods, Route } from '@sapphire/plugin-api';

import { pickRandom } from '#lib/utils';

const randomMessages = [
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
  route: '',
})
export class MainRoute extends Route {
  public [methods.GET](_request: ApiRequest, response: ApiResponse) {
    response.json({
      message: pickRandom(randomMessages),
    });
  }
}
