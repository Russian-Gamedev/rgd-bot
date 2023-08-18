import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('Invites')
export class DiscordInvites extends BaseEntity {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @CreateDateColumn()
  date_created: Date;

  @UpdateDateColumn()
  date_updated: Date;

  @Column({ type: 'integer', default: 0 })
  uses: number;

  @Column({ type: 'varchar' })
  alias: string;

  @Column({ type: 'varchar', length: 19 })
  inviter: string;
}
