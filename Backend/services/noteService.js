import prisma from "../dbConnect/prismaClient.js";

export class NoteServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "NoteServiceError";
    this.statusCode = statusCode;
  }
}

async function assertBookOwned({ userId, bookId }) {
  const book = await prisma.book.findFirst({
    where: { bookId, userId, isDeleted: false },
  });

  if (!book) {
    throw new NoteServiceError("Book not found", 404);
  }

  return book;
}

async function nextOrderIndex(bookId) {
  const last = await prisma.note.findFirst({
    where: { bookId, isDeleted: false },
    orderBy: { orderIndex: "desc" },
    select: { orderIndex: true },
  });
  return (last?.orderIndex ?? -1) + 1;
}

export async function createNote({
  userId,
  bookId,
  title,
  content = "",
  format = "markdown",
  status = "ACTIVE",
  summary,
  section,
  orderIndex,
  threadId,
}) {
  await assertBookOwned({ userId, bookId });

  const trimmedTitle = title?.trim();
  if (!trimmedTitle) {
    throw new NoteServiceError("Title is required", 400);
  }

  const resolvedOrder =
    orderIndex === undefined || orderIndex === null
      ? await nextOrderIndex(bookId)
      : Number(orderIndex);

  const note = await prisma.note.create({
    data: {
      bookId,
      userId,
      title: trimmedTitle,
      content: content ?? "",
      format: format || "markdown",
      status: status || "ACTIVE",
      summary: summary?.trim() || null,
      section: section?.trim() || null,
      orderIndex: Number.isFinite(resolvedOrder) ? resolvedOrder : 0,
      threadId: threadId || null,
      createdBy: userId,
    },
  });

  await prisma.book.update({
    where: { bookId },
    data: { updatedAt: new Date() },
  });

  return note;
}

export async function listNotes({
  userId,
  bookId,
  page = 1,
  limit = 20,
  q,
  section,
  status = "ACTIVE",
}) {
  await assertBookOwned({ userId, bookId });

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const where = {
    bookId,
    userId,
    isDeleted: false,
    ...(status ? { status } : {}),
    ...(section?.trim() ? { section: section.trim() } : {}),
    ...(q?.trim()
      ? {
          OR: [
            { title: { contains: q.trim(), mode: "insensitive" } },
            { content: { contains: q.trim(), mode: "insensitive" } },
            { summary: { contains: q.trim(), mode: "insensitive" } },
            { section: { contains: q.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
      skip,
      take: safeLimit,
      select: {
        noteId: true,
        bookId: true,
        userId: true,
        threadId: true,
        title: true,
        summary: true,
        section: true,
        orderIndex: true,
        format: true,
        status: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.note.count({ where }),
  ]);

  return {
    notes,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

export async function getNote({ userId, noteId, bookId }) {
  const note = await prisma.note.findFirst({
    where: {
      noteId,
      userId,
      isDeleted: false,
      ...(bookId ? { bookId } : {}),
    },
  });

  if (!note) {
    throw new NoteServiceError("Note not found", 404);
  }

  return note;
}

export async function updateNote({
  userId,
  noteId,
  bookId,
  title,
  content,
  format,
  status,
  summary,
  section,
  orderIndex,
}) {
  const existing = await getNote({ userId, noteId, bookId });

  const data = { updatedBy: userId };

  if (title !== undefined) {
    const trimmed = title?.trim();
    if (!trimmed) {
      throw new NoteServiceError("Title is required", 400);
    }
    data.title = trimmed;
  }

  if (content !== undefined) data.content = content;
  if (format !== undefined) data.format = format;
  if (summary !== undefined) data.summary = summary?.trim() || null;
  if (section !== undefined) data.section = section?.trim() || null;

  if (status !== undefined) {
    if (!["ACTIVE", "ARCHIVED"].includes(status)) {
      throw new NoteServiceError("Invalid status", 400);
    }
    data.status = status;
  }

  if (orderIndex !== undefined) {
    data.orderIndex = Number(orderIndex) || 0;
  }

  const note = await prisma.note.update({
    where: { noteId: existing.noteId },
    data,
  });

  await prisma.book.update({
    where: { bookId: existing.bookId },
    data: { updatedAt: new Date() },
  });

  return note;
}

export async function softDeleteNote({ userId, noteId, bookId }) {
  const existing = await getNote({ userId, noteId, bookId });

  await prisma.note.update({
    where: { noteId: existing.noteId },
    data: { isDeleted: true, updatedBy: userId },
  });

  await prisma.book.update({
    where: { bookId: existing.bookId },
    data: { updatedAt: new Date() },
  });

  return { noteId: existing.noteId, bookId: existing.bookId };
}

export async function reorderNotes({ userId, bookId, items }) {
  await assertBookOwned({ userId, bookId });

  if (!Array.isArray(items) || items.length === 0) {
    throw new NoteServiceError("items array is required", 400);
  }

  await prisma.$transaction(
    items.map(({ noteId, orderIndex }) =>
      prisma.note.updateMany({
        where: { noteId, bookId, userId, isDeleted: false },
        data: { orderIndex: Number(orderIndex) || 0, updatedBy: userId },
      })
    )
  );

  return listNotes({ userId, bookId, page: 1, limit: items.length });
}
