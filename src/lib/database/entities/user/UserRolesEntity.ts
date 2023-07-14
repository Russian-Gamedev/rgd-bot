import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_Discord_Roles')
export class UserRoles extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 19 })
  user_id: string;

  @Column('varchar', { length: 19, name: 'Discord_Roles_id' })
  role_id: string;
}
