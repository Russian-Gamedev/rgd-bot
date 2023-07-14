import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reputation_list')
export class ReputationList extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column('varchar', { length: 19 })
  targetId: string;

  @Column('varchar', { length: 19 })
  fromId: string;

  @Column('varchar', { length: 200 })
  reason: string;
}
