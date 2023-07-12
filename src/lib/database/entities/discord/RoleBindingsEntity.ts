import { container } from '@sapphire/pieces';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Role_Bindings')
export class RoleBindings extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  role: string;

  @Column('varchar')
  message: string;

  @Column('varchar')
  channel: string;

  @Column('varchar')
  emoji: string;

  static cache: RoleBindingsCache;
}

class RoleBindingsCache {
  data: RoleBindings[] = [];

  get(channel: string, message: string, emoji: string) {
    for (const rb of this.data) {
      if (
        rb.channel === channel &&
        rb.message === message &&
        rb.emoji === emoji
      ) {
        return rb;
      }
    }

    return undefined;
  }

  async load() {
    this.data = await RoleBindings.find();
    container.logger.info('[RoleBindings] loaded');
  }
}

container.client.on('ready', () => {
  RoleBindings.cache = new RoleBindingsCache();
  RoleBindings.cache.load().catch(container.logger.error);
});
