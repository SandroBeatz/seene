import { describe, expect, it } from '@jest/globals';
import { QueryClient } from '@tanstack/react-query';
import { hideFromLists } from './hide-from-lists';

const rows = [{ id: 'a' }, { id: 'b' }];

describe('hideFromLists', () => {
  it('removes the row from every list under the key', () => {
    const qc = new QueryClient();
    qc.setQueryData(['clients', 'u'], rows);
    qc.setQueryData(['clients', 'u', 'range'], rows);
    hideFromLists(qc, [['clients', 'u']], 'a');
    expect(qc.getQueryData(['clients', 'u'])).toEqual([{ id: 'b' }]);
    expect(qc.getQueryData(['clients', 'u', 'range'])).toEqual([{ id: 'b' }]);
  });

  it('leaves what is not a list alone', () => {
    const qc = new QueryClient();
    qc.setQueryData(['clients', 'u', 'count'], 3);
    hideFromLists(qc, [['clients', 'u']], 'a');
    expect(qc.getQueryData(['clients', 'u', 'count'])).toBe(3);
  });

  it('puts the row back', () => {
    const qc = new QueryClient();
    qc.setQueryData(['clients', 'u'], rows);
    hideFromLists(qc, [['clients', 'u']], 'a')();
    expect(qc.getQueryData(['clients', 'u'])).toEqual(rows);
  });
});
