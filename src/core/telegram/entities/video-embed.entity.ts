import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#common/entities/base.entity';

@Entity({ tableName: 'video_embeds' })
export class VideoEmbedEntity extends BaseEntity {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuidv7()' })
  id: string;

  @Property({ type: 'text' })
  file_id: string;

  @Property({ type: 'json' })
  metadata: VideoInfo;
}

export interface VideoInfo {
  width: number;
  height: number;
  duration: number;
  size: number;
  name: string;
  author: string;
  link: string;
}
