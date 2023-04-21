import { DirectusEntity } from '../directus-orm/entity';

export class StatsDay extends DirectusEntity {
  static override collection = 'Bot_Stats_Day';
  user: string;
  chat = 0;
  voice = 0;
  reactions = 0;
}

export class StatsWeek extends DirectusEntity {
  static override collection = 'Bot_Stats_Week';
  user: string;
  chat = 0;
  voice = 0;
  reactions = 0;
}

export type Stats = StatsDay | StatsWeek;
