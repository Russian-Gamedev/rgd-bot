import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('Discord_Roles')
export class DiscordRole extends BaseEntity {
  @PrimaryColumn('varchar', { length: 19 })
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar')
  color: string;

  @Column('varchar')
  position: number;
}
