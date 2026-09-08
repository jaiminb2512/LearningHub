import prisma from "../dbConnect/prismaClient.js";

const INBOX_TITLE = "Inbox";

export class BookServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "BookServiceError";
    this.statusCode = statusCode;
  }
}

const bookListSelect = {
  bookId: true,
  userId: true,
  threadId: true,
  title: true,
  description: true,
  summary: true,
  status: true,
  sourceType: true,
  isDefault: true,
  isDeleted: true,
  createdBy: true,
  updatedBy: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      notes: { where: { isDeleted: false } },
    },
  },
};

const mapBook = (book) => {
  if (!book) return null;
  const { _count, ...rest } = book;
  return {
    ...rest,
    noteCount: _count?.notes ?? 0,
  };
};

export async function ensureInboxBook(userId) {
  const existing = await prisma.book.findFirst({
    where: { userId, isDefault: true, isDeleted: false },
  });

  if (existing) {
    return existing;
  }

  return prisma.book.create({
    data: {
      userId,
      title: INBOX_TITLE,
      description: "Quick notes",
      isDefault: true,
      sourceType: "MANUAL",
      createdBy: userId,
    },
  });
}

export async function createBook({
  userId,
  title,
  description,
  threadId,
  sourceType = "MANUAL",
}) {
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) {
    throw new BookServiceError("Title is required", 400);
  }

  const book = await prisma.book.create({
    data: {
      userId,
      title: trimmedTitle,
      description: description?.trim() || null,
      threadId: threadId || null,
      sourceType,
      createdBy: userId,
    },
    select: bookListSelect,
  });

  return mapBook(book);
}

export async function listBooks({
  userId,
  page = 1,
  limit = 20,
  q,
  status = "ACTIVE",
}) {
  await ensureInboxBook(userId);

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = {
    userId,
    isDeleted: false,
    ...(status ? { status } : {}),
    ...(q?.trim()
      ? {
          OR: [
            { title: { contains: q.trim(), mode: "insensitive" } },
            { description: { contains: q.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      skip,
      take: safeLimit,
      select: bookListSelect,
    }),
    prisma.book.count({ where }),
  ]);

  return {
    books: books.map(mapBook),
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

export async function getBook({ userId, bookId }) {
  const book = await prisma.book.findFirst({
    where: { bookId, userId, isDeleted: false },
    select: bookListSelect,
  });

  if (!book) {
    throw new BookServiceError("Book not found", 404);
  }

  return mapBook(book);
}

export async function updateBook({
  userId,
  bookId,
  title,
  description,
  status,
  summary,
}) {
  const existing = await prisma.book.findFirst({
    where: { bookId, userId, isDeleted: false },
  });

  if (!existing) {
    throw new BookServiceError("Book not found", 404);
  }

  const data = { updatedBy: userId };

  if (title !== undefined) {
    const trimmed = title?.trim();
    if (!trimmed) {
      throw new BookServiceError("Title is required", 400);
    }
    if (existing.isDefault) {
      throw new BookServiceError("Cannot rename the Inbox book", 400);
    }
    data.title = trimmed;
  }

  if (description !== undefined) {
    data.description = description?.trim() || null;
  }

  if (summary !== undefined) {
    data.summary = summary?.trim() || null;
  }

  if (status !== undefined) {
    if (!["ACTIVE", "ARCHIVED"].includes(status)) {
      throw new BookServiceError("Invalid status", 400);
    }
    data.status = status;
  }

  const book = await prisma.book.update({
    where: { bookId },
    data,
    select: bookListSelect,
  });

  return mapBook(book);
}

export async function softDeleteBook({ userId, bookId }) {
  const existing = await prisma.book.findFirst({
    where: { bookId, userId, isDeleted: false },
  });

  if (!existing) {
    throw new BookServiceError("Book not found", 404);
  }

  if (existing.isDefault) {
    throw new BookServiceError("Cannot delete the Inbox book", 400);
  }

  await prisma.$transaction([
    prisma.note.updateMany({
      where: { bookId, userId, isDeleted: false },
      data: { isDeleted: true, updatedBy: userId },
    }),
    prisma.book.update({
      where: { bookId },
      data: { isDeleted: true, updatedBy: userId },
    }),
  ]);

  return { bookId };
}
