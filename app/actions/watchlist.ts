'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Helper to retrieve current authenticated user.
 */
async function getUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id;
}

export async function getWatchlist() {
  const userId = await getUserId();
  if (!userId) return [];

  // Get or create default watchlist
  let watchlist = await db.watchlist.findFirst({
    where: { userId, name: 'DEFAULT' },
    include: { items: true },
  });

  if (!watchlist) {
    watchlist = await db.watchlist.create({
      data: { userId, name: 'DEFAULT' },
      include: { items: true },
    });
  }

  return watchlist.items;
}

export async function addWatchlistItem(symbol: string) {
  const userId = await getUserId();
  if (!userId) throw new Error('Authentication required.');

  const cleanSym = symbol.trim().toUpperCase();

  let watchlist = await db.watchlist.findFirst({
    where: { userId, name: 'DEFAULT' },
  });

  if (!watchlist) {
    watchlist = await db.watchlist.create({
      data: { userId, name: 'DEFAULT' },
    });
  }

  try {
    await db.watchlistItem.create({
      data: {
        watchlistId: watchlist.id,
        symbol: cleanSym,
      },
    });
    revalidatePath('/watchlists');
  } catch (err) {
    // Item might already exist, catch silently
  }
}

export async function removeWatchlistItem(symbol: string) {
  const userId = await getUserId();
  if (!userId) throw new Error('Authentication required.');

  const cleanSym = symbol.trim().toUpperCase();

  const watchlist = await db.watchlist.findFirst({
    where: { userId, name: 'DEFAULT' },
  });

  if (!watchlist) return;

  await db.watchlistItem.deleteMany({
    where: {
      watchlistId: watchlist.id,
      symbol: cleanSym,
    },
  });

  revalidatePath('/watchlists');
}

export async function getNotes() {
  const userId = await getUserId();
  if (!userId) return [];

  return db.note.findMany({
    where: { userId },
  });
}

export async function saveNote(symbol: string, content: string) {
  const userId = await getUserId();
  if (!userId) throw new Error('Authentication required.');

  const cleanSym = symbol.trim().toUpperCase();

  await db.note.upsert({
    where: {
      userId_symbol: { userId, symbol: cleanSym },
    },
    update: { content },
    create: { userId, symbol: cleanSym, content },
  });

  revalidatePath('/watchlists');
}

export async function getAlerts() {
  const userId = await getUserId();
  if (!userId) return [];

  return db.alert.findMany({
    where: { userId },
  });
}

export async function createAlert(symbol: string, type: 'ABOVE' | 'BELOW', targetPrice: number, channel: string) {
  const userId = await getUserId();
  if (!userId) throw new Error('Authentication required.');

  const cleanSym = symbol.trim().toUpperCase();

  await db.alert.create({
    data: {
      userId,
      symbol: cleanSym,
      type,
      targetPrice,
      channel,
    },
  });

  revalidatePath('/watchlists');
}

export async function deleteAlert(id: string) {
  const userId = await getUserId();
  if (!userId) throw new Error('Authentication required.');

  await db.alert.delete({
    where: { id, userId },
  });

  revalidatePath('/watchlists');
}
