/**
 * "Добавить из контактов телефона": asks for the phone book, turns it into rows the
 * master ticks (numbers already in the book are marked and can't be ticked), and
 * adds the ticked ones in one go.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { importCandidates, useClientsQuery, useImportClientsMutation } from '@/entities/client';
import { useUserId } from '@/entities/session';
import type { CountryCode } from '@/shared/lib/phone';
import { readPhoneBook, requestPhoneBook, shareMoreContacts } from '@/shared/lib/phone-book';

export function usePhoneBookImport(country: CountryCode) {
  const userId = useUserId() ?? '';
  const clients = useClientsQuery(userId);
  const save = useImportClientsMutation(userId);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set());
  // Read fresh on every opening: the phone book changes outside the app.
  const book = useQuery({
    queryKey: ['phone-book'],
    queryFn: async () => {
      const access = await requestPhoneBook();
      return { access, contacts: access === 'none' ? [] : await readPhoneBook() };
    },
    gcTime: 0,
    staleTime: 0,
    retry: false,
    // Contacts never go to the on-disk query cache.
    meta: { persist: false },
  });

  const rows = useMemo(
    () => (book.data ? importCandidates(book.data.contacts, clients.data ?? [], country) : []),
    [book.data, clients.data, country],
  );

  const toggle = (contactId: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });

  const shareMore = async () => {
    await shareMoreContacts();
    await book.refetch();
  };

  return {
    access: book.data?.access ?? null,
    rows,
    picked,
    toggle,
    setPicked,
    isLoading: book.isPending || clients.isPending,
    failed: book.isError,
    retry: book.refetch,
    shareMore,
    save,
    cards: rows.filter((row) => picked.has(row.contactId)).map((row) => row.card),
  };
}
