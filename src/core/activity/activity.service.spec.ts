import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';

import type { MetricsService } from '#common/metrics/metrics.service';
import { MemberProfileEntity } from '#core/users/entities/member-profile.entity';
import { UserProfileEntity } from '#core/users/entities/user-profile.entity';
import type { UserService } from '#core/users/users.service';
import { ActivityService } from './activity.service';
import { UserActivityDailyEntity } from './entities/user-activity-daily.entity';
import { UserActivityTotalEntity } from './entities/user-activity-total.entity';

function applyMockRawUpdate(
  row: Record<string, unknown>,
  data: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(data)) {
    if (
      value != null &&
      typeof value === 'object' &&
      'sql' in (value as Record<string, unknown>) &&
      'params' in (value as Record<string, unknown>)
    ) {
      const rawExpr = value as { sql: string; params: unknown[] };
      const match = rawExpr.sql.match(/^(\w+)\s*\+\s*\?$/);
      if (match) {
        const field = match[1] as string;
        const current = Number(row[field] ?? 0);
        const increment = Number(rawExpr.params[0] ?? 0);
        row[field] = current + increment;
      }
    } else {
      row[key] = value;
    }
  }
}

describe('ActivityService', () => {
  let service: ActivityService;
  let dailyRows: UserActivityDailyEntity[];
  let totalRows: UserActivityTotalEntity[];
  let memberProfiles: MemberProfileEntity[];
  let userProfiles: UserProfileEntity[];
  let userService: UserService;
  let em: EntityManager;
  let metrics: MetricsService;

  beforeEach(() => {
    dailyRows = [];
    totalRows = [];
    memberProfiles = [];
    userProfiles = [];

    const dailyRepository = {
      find: mock(async (where) =>
        dailyRows.filter(
          (row) =>
            row.guild_id === where.guild_id &&
            row.date >= where.date.$gte &&
            row.date < where.date.$lt,
        ),
      ),
      findOne: mock(async (where) =>
        dailyRows.find(
          (row) =>
            row.user_id === where.user_id &&
            row.guild_id === where.guild_id &&
            row.date === where.date,
        ),
      ),
    } as unknown as EntityRepository<UserActivityDailyEntity>;

    const totalRepository = {
      find: mock(async (where, options) => {
        let rows = totalRows.filter((row) => row.guild_id === where.guild_id);
        if (where.user_id?.$nin) {
          rows = rows.filter(
            (row) => !where.user_id.$nin.includes(row.user_id),
          );
        }
        for (const field of [
          'message_score',
          'voice_seconds',
          'reaction_count',
        ] as const) {
          if (where[field]?.$gt != null) {
            rows = rows.filter((row) => row[field] > where[field].$gt);
          }
        }
        const orderField = Object.keys(options?.orderBy ?? {})[0] as
          | keyof UserActivityTotalEntity
          | undefined;
        if (orderField) {
          rows = rows.toSorted(
            (a, b) => Number(b[orderField]) - Number(a[orderField]),
          );
        }
        return rows.slice(0, options?.limit ?? rows.length);
      }),
      findOne: mock(async (where) =>
        totalRows.find(
          (row) =>
            row.user_id === where.user_id && row.guild_id === where.guild_id,
        ),
      ),
    } as unknown as EntityRepository<UserActivityTotalEntity>;

    const memberRepository = {
      find: mock(async (where, options) => {
        let rows = memberProfiles.filter(
          (row) => row.guild_id === where.guild_id,
        );
        if (where.isLeftGuild != null) {
          rows = rows.filter((row) => row.isLeftGuild === where.isLeftGuild);
        }
        if (where.user_id?.$in) {
          rows = rows.filter((row) => where.user_id.$in.includes(row.user_id));
        }
        if (where.user_id?.$nin) {
          rows = rows.filter(
            (row) => !where.user_id.$nin.includes(row.user_id),
          );
        }
        if (where.activeStreak?.$gt != null) {
          rows = rows.filter(
            (row) => row.activeStreak > where.activeStreak.$gt,
          );
        }
        if (where.lastActiveAt?.$lte) {
          rows = rows.filter(
            (row) =>
              row.lastActiveAt != null &&
              row.lastActiveAt <= where.lastActiveAt.$lte,
          );
        }
        rows = rows.toSorted((a, b) => b.activeStreak - a.activeStreak);
        return rows.slice(0, options?.limit ?? rows.length);
      }),
    } as unknown as EntityRepository<MemberProfileEntity>;

    em = {
      nativeUpdate: mock(
        async (
          entity: unknown,
          where: Record<string, unknown>,
          data: Record<string, unknown>,
        ) => {
          if (entity === UserActivityDailyEntity) {
            const rows = dailyRows.filter(
              (row) =>
                row.user_id === (where.user_id as bigint) &&
                row.guild_id === (where.guild_id as bigint | null) &&
                row.date === (where.date as string),
            );
            for (const row of rows) {
              applyMockRawUpdate(
                row as unknown as Record<string, unknown>,
                data,
              );
            }
            return rows.length;
          }
          if (entity === UserActivityTotalEntity) {
            const rows = totalRows.filter(
              (row) =>
                row.user_id === (where.user_id as bigint) &&
                row.guild_id === (where.guild_id as bigint | null),
            );
            for (const row of rows) {
              applyMockRawUpdate(
                row as unknown as Record<string, unknown>,
                data,
              );
            }
            return rows.length;
          }
          const rows =
            entity === UserProfileEntity ? userProfiles : memberProfiles;
          for (const row of rows) {
            if (
              'guild_id' in row &&
              (where.guild_id as bigint) !== row.guild_id
            )
              continue;
            const userIdWhere = where.user_id as
              | { $nin?: bigint[] }
              | undefined;
            if (userIdWhere?.$nin?.includes(row.user_id)) continue;
            Object.assign(row, data);
          }
          return rows.length;
        },
      ),
      insert: mock(async (entity: unknown, data: Record<string, unknown>) => {
        if (entity === UserActivityDailyEntity) {
          const key = `${String(data.date)}:${String(data.user_id)}:${String(data.guild_id ?? 'global')}`;
          const existingIndex = dailyRows.findIndex(
            (row) =>
              `${row.date}:${String(row.user_id)}:${String(row.guild_id ?? 'global')}` ===
              key,
          );
          if (existingIndex >= 0) {
            Object.assign(dailyRows[existingIndex], data);
          } else {
            const row = new UserActivityDailyEntity();
            Object.assign(row, data);
            dailyRows.push(row);
          }
          return;
        }
        if (entity === UserActivityTotalEntity) {
          const key = `${String(data.user_id)}:${String(data.guild_id ?? 'global')}`;
          const existingIndex = totalRows.findIndex(
            (row) =>
              `${String(row.user_id)}:${String(row.guild_id ?? 'global')}` ===
              key,
          );
          if (existingIndex >= 0) {
            Object.assign(totalRows[existingIndex], data);
          } else {
            const row = new UserActivityTotalEntity();
            Object.assign(row, data);
            totalRows.push(row);
          }
          return;
        }
      }),
    } as unknown as EntityManager;

    userService = {
      findOrCreateMember: mock(async (guildId: bigint, userId: bigint) => {
        let member = memberProfiles.find(
          (row) => row.guild_id === guildId && row.user_id === userId,
        );
        if (!member) {
          member = new MemberProfileEntity();
          member.guild_id = guildId;
          member.user_id = userId;
          member.isLeftGuild = false;
          memberProfiles.push(member);
        }
        return member;
      }),
      findOrCreateProfile: mock(async (userId: bigint) => {
        let profile = userProfiles.find((row) => row.user_id === userId);
        if (!profile) {
          profile = new UserProfileEntity();
          profile.user_id = userId;
          profile.lastActiveAt = new Date('2026-06-13T00:00:00.000Z');
          userProfiles.push(profile);
        }
        return profile;
      }),
      save: mock(async () => undefined),
    } as unknown as UserService;
    metrics = {
      recordActivityIncrement: mock(() => undefined),
    } as unknown as MetricsService;

    service = new ActivityService(
      dailyRepository,
      totalRepository,
      memberRepository,
      em,
      userService,
      metrics,
    );
  });

  it('writes global and guild daily and total rows in one call', async () => {
    const at = new Date('2026-06-13T12:34:00.000Z');

    await service.recordActivity(10n, 20n, {
      at,
      messageScore: 3,
      reactionCount: 1,
      voiceSeconds: 60,
    });

    expect(dailyRows).toHaveLength(2);
    expect(totalRows).toHaveLength(2);
    expect(totalRows.map((row) => row.guild_id).toSorted()).toEqual([
      10n,
      null,
    ]);
    expect(totalRows.every((row) => row.message_score === 3)).toBe(true);
    expect(totalRows.every((row) => row.voice_seconds === 60)).toBe(true);
    expect(memberProfiles[0]?.lastActiveAt).toBe(at);
    expect(userProfiles[0]?.lastActiveAt).toBe(at);
    expect(metrics.recordActivityIncrement).toHaveBeenCalledWith({
      guildId: '10',
      roleSegment: 'unknown',
      kind: 'message',
      amount: 3,
    });
    expect(metrics.recordActivityIncrement).toHaveBeenCalledWith({
      guildId: '10',
      roleSegment: 'unknown',
      kind: 'voice',
      amount: 60,
    });
    expect(metrics.recordActivityIncrement).toHaveBeenCalledWith({
      guildId: '10',
      roleSegment: 'unknown',
      kind: 'reaction',
      amount: 1,
    });
  });

  it('increments existing bigint voice counters returned by postgres', async () => {
    const at = new Date('2026-06-13T12:34:00.000Z');
    const date = '2026-06-13';
    const daily = new UserActivityDailyEntity();
    daily.date = date;
    daily.user_id = 20n;
    daily.guild_id = 10n;
    daily.voice_seconds = 40n as unknown as number;
    dailyRows.push(daily);

    const total = new UserActivityTotalEntity();
    total.user_id = 20n;
    total.guild_id = 10n;
    total.voice_seconds = 40n as unknown as number;
    totalRows.push(total);

    await service.recordActivity(10n, 20n, {
      at,
      voiceSeconds: 20,
    });

    expect(daily.voice_seconds).toBe(60);
    expect(total.voice_seconds).toBe(60);
  });

  it('aggregates activity rows over a date range', async () => {
    await service.recordActivity(10n, 20n, {
      at: new Date('2026-06-13T01:00:00.000Z'),
      messageScore: 2,
    });
    await service.recordActivity(10n, 20n, {
      at: new Date('2026-06-13T02:00:00.000Z'),
      messageScore: 5,
      voiceSeconds: 30,
    });

    await expect(
      service.getActivityStatsInRange(10n, '2026-06-13', '2026-06-14'),
    ).resolves.toEqual([
      {
        guild_id: 10n,
        message_score: 7,
        reaction_count: 0,
        user_id: 20n,
        voice_seconds: 30,
      },
    ]);
  });

  it('aggregates bigint voice counters returned by postgres', async () => {
    const row = new UserActivityDailyEntity();
    row.date = '2026-06-13';
    row.guild_id = 10n;
    row.user_id = 20n;
    row.voice_seconds = 30n as unknown as number;
    dailyRows.push(row);

    await expect(
      service.getActivityStatsInRange(10n, '2026-06-13', '2026-06-14'),
    ).resolves.toEqual([
      {
        guild_id: 10n,
        message_score: 0,
        reaction_count: 0,
        user_id: 20n,
        voice_seconds: 30,
      },
    ]);
  });

  it('stores daily activity by Moscow calendar date without UTC date shift', async () => {
    await service.recordActivity(10n, 20n, {
      at: new Date('2026-07-06T15:08:34.000Z'),
      voiceSeconds: 60,
    });

    expect(dailyRows.map((row) => row.date).toSorted()).toEqual([
      '2026-07-06',
      '2026-07-06',
    ]);
  });

  it('returns top totals for a guild field', async () => {
    await service.recordActivity(10n, 20n, { voiceSeconds: 10 });
    await service.recordActivity(10n, 21n, { voiceSeconds: 30 });

    const top = await service.getTopActivityTotals(10n, 'voice_seconds', 1);

    expect(top.map((row) => row.user_id)).toEqual([21n]);
  });

  it('updates profile streaks without double-counting duplicate active users', async () => {
    const active = await userService.findOrCreateProfile(20n);
    const inactive = await userService.findOrCreateProfile(21n);
    active.activeStreak = 2;
    inactive.activeStreak = 3;

    await service.updateProfileStreaks([20n, 20n]);

    expect(active.activeStreak).toBe(3);
    expect(inactive.activeStreak).toBe(0);
  });

  it('resets inactive member streaks per guild', async () => {
    const active = await userService.findOrCreateMember(10n, 20n);
    const inactive = await userService.findOrCreateMember(10n, 21n);
    active.activeStreak = 2;
    inactive.activeStreak = 3;

    await service.resetInactiveMemberStreaks(10n, [20n]);

    expect(active.activeStreak).toBe(2);
    expect(inactive.activeStreak).toBe(0);
  });
});
