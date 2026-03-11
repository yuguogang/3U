// // ************* Cursor Pagination *************

// export type CursorPaginateArgs<TItem> = {
//   cursor?: string | number | null;
//   cursorKey?: keyof TItem | string;

//   take?: number;
//   maxTake?: number;
//   orderBy?: Record<string, any>;

//   // cursor 模式不能手动 skip，因此去掉 skip
//   query: (args: {
//     skip?: number;
//     take: number;
//     cursor?: Record<string, any>;
//     orderBy?: Record<string, any>;
//   }) => Promise<TItem[]>;
// };

// export type CursorPaginateData<TItem> = {
//   items: TItem[];
//   nextCursor: string | number | null;
//   hasNext: boolean;
// };

// export function defaultCursorPaginateData<T>(): CursorPaginateData<T> {
//   return {
//     items: [],
//     nextCursor: null,
//     hasNext: false,
//   };
// }

// export async function cursorPaginate<TItem>({
//   cursor,
//   cursorKey = 'id',
//   take = 20,
//   maxTake = 500,
//   orderBy,
//   query,
// }: CursorPaginateArgs<TItem>): Promise<CursorPaginateData<TItem>> {
//   // 限制最大和最小 take
//   if (take < 1) take = 1;
//   if (take > maxTake) take = maxTake;

//   // Prisma 的 cursor 模式下：
//   // cursor != null → skip = 1（跳过 cursor 指向的记录）
//   const skip = cursor != null ? 1 : 0;

//   const data = await query({
//     skip,
//     take: take + 1, // 多取一个判断是否有下一页
//     cursor: cursor != null ? { [cursorKey]: cursor } : undefined,
//     orderBy,
//   });

//   const hasNext = data.length > take;

//   // 真实返回项
//   const items = hasNext ? data.slice(0, take) : data;

//   // 下一页的 cursor 应该取 items 最后一项
//   const last = items[items.length - 1] as any;
//   const nextCursor = hasNext ? (last?.[cursorKey] ?? null) : null;

//   return {
//     items,
//     nextCursor,
//     hasNext,
//   };
// }

// ************* Page Pagination *************

export class PaginationArgumentError extends Error {
  name = 'PaginationArgumentError';
  statusCode = 422;
  constructor(message = 'The pagination arguments are invalid') {
    super(message);
  }
}

export type PaginateArgs<QueryResult> = {
  count: () => Promise<number>;
  maxTake?: number;
  query: (args: { skip: number; take: number }) => Promise<QueryResult[]>;
  skip?: number;
  take?: number;
};

const isInteger = (value: unknown) =>
  typeof value === 'number' && value % 1 === 0;

export async function paginate<QueryResult>({
  skip = 0,
  take = 0,
  maxTake = 250,
  count: countQuery,
  query,
}: PaginateArgs<QueryResult>) {
  skip = Number.parseInt(skip.toString());
  take = Number.parseInt(take.toString());

  if (!isInteger(skip)) {
    throw new PaginationArgumentError('`skip` argument must be a integer');
  }
  if (!isInteger(take)) {
    throw new PaginationArgumentError('`take` argument must be a integer');
  }
  if (!isInteger(maxTake)) {
    throw new PaginationArgumentError('`maxTake` argument must be a integer');
  }
  if (typeof countQuery !== 'function') {
    throw new PaginationArgumentError('`count` argument must be a function');
  }
  if (typeof query !== 'function') {
    throw new PaginationArgumentError('`query` argument must be a function');
  }
  if (skip < 0) {
    throw new PaginationArgumentError(
      '`skip` argument must be a positive number',
    );
  }
  if (take < 0) {
    throw new PaginationArgumentError(
      '`take` argument must be a positive number',
    );
  }
  if (take > maxTake) {
    throw new PaginationArgumentError(
      `\`take\` argument must less than \`maxTake\` which is currently ${maxTake}`,
    );
  }

  const [count, items] = await Promise.all([
    countQuery(),
    query({ skip, take }),
  ]);

  const hasMore = skip + take < count;
  const nextPage = hasMore ? { take, skip: skip + take } : null;
  const pageCount = Math.floor((count + take - 1) / take);
  const from = skip + 1;
  const to = skip + take;

  const result: PaginateData<QueryResult> = {
    items,
    nextPage,
    hasMore,
    pageCount,
    pageSize: take,
    from,
    to,
    count,
  };

  return result;
}

export type PaginateData<QueryResult> = {
  count: number;
  from: number;
  hasMore: boolean;
  items: QueryResult[];
  nextPage: null | { skip: number; take: number };
  pageCount: number;
  pageSize: number;
  to: number;
};

export function defaultPaginateData<T>(): PaginateData<T> {
  return {
    items: [],
    nextPage: null,
    hasMore: false,
    pageCount: 0,
    pageSize: 1,
    from: 0,
    to: 0,
    count: 0,
  };
}
