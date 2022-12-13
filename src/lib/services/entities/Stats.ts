import { DirectusEntity } from './../Entity';

export class StatsDay extends DirectusEntity {
  static override collection = 'Bot_Stats_Day';
  user: string;
  chat = 0;
  voice = 0;
}

export class StatsWeek extends DirectusEntity {
  static override collection = 'Bot_Stats_Week';
  user: string;
  chat = 0;
  voice = 0;
}
