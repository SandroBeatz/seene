import { describe, expect, it } from '@jest/globals';
import { DEFAULT_TEMPLATES, variablesOf } from '../config/defaults';
import { MESSAGE_KINDS, MESSAGE_LANGUAGES, MESSAGE_VARIABLES } from '../model/types';
import {
  fromEditable,
  messageDateTime,
  messageLanguageFor,
  renderTemplate,
  sitePath,
  templateSegments,
  toEditable,
  usesVariable,
  type VariableLabels,
} from './render';

const labels = Object.fromEntries(
  MESSAGE_VARIABLES.map((name) => [name, `L ${name}`]),
) as VariableLabels;

describe('renderTemplate', () => {
  it('fills the values in', () => {
    expect(
      renderTemplate('{client_name}, ждём {date_time}.', {
        client_name: 'Айгерим',
        date_time: '5 ноября в 16:00',
      }),
    ).toBe('Айгерим, ждём 5 ноября в 16:00.');
  });

  it('drops a line with a value we do not have', () => {
    expect(
      renderTemplate('{client_name}, привет.\nАдрес: {address}.\nПодробнее: {booking_link}', {
        client_name: 'Ая',
        address: '',
        booking_link: null,
      }),
    ).toBe('Ая, привет.');
  });

  it('keeps braces that are not a variable', () => {
    expect(renderTemplate('Скидка {10%} и {nope}', {})).toBe('Скидка {10%} и {nope}');
  });
});

describe('templateSegments', () => {
  it('splits text and variables', () => {
    expect(templateSegments('{client_name}, ждём {nope} {price}.')).toEqual([
      { text: 'client_name', variable: 'client_name' },
      { text: ', ждём {nope} ' },
      { text: 'price', variable: 'price' },
      { text: '.' },
    ]);
  });
});

describe('editing', () => {
  it('survives the round trip', () => {
    const body = '{client_name}, {date_time} {unknown} {online_link}';
    expect(fromEditable(toEditable(body, labels), labels)).toBe(body);
  });

  it('reads the labels a master typed', () => {
    expect(fromEditable('[L client_name], привет', labels)).toBe('{client_name}, привет');
  });
});

describe('messageDateTime', () => {
  const iso = '2026-11-05T10:00:00Z';
  const zone = 'Asia/Bishkek';

  it("writes the date in the language, on the master's clock", () => {
    expect(messageDateTime(iso, { zone, timeFormat: 24, language: 'ru' })).toBe('5 ноября в 16:00');
    expect(messageDateTime(iso, { zone, timeFormat: 24, language: 'fr' })).toBe(
      '5 novembre à 16:00',
    );
    expect(messageDateTime(iso, { zone, timeFormat: 12, language: 'en' })).toBe(
      'November 5 at 4:00 PM',
    );
  });
});

describe('messageLanguageFor', () => {
  it('prefers the fixed language, then the client, then the master', () => {
    expect(messageLanguageFor('en', 'fr', 'ru')).toBe('en');
    expect(messageLanguageFor('auto', 'fr', 'ru')).toBe('fr');
    expect(messageLanguageFor('auto', null, 'ru')).toBe('ru');
    expect(messageLanguageFor(undefined, 'de', 'ru')).toBe('ru');
  });
});

describe('sitePath', () => {
  it('prefixes every language but English', () => {
    expect(sitePath('https://x.app', 'ru', 'c/abc')).toBe('https://x.app/ru/c/abc');
    expect(sitePath('https://x.app', 'en', 'karina')).toBe('https://x.app/karina');
  });
});

describe('standard texts', () => {
  it('use only the variables their kind offers, the same ones in every language', () => {
    for (const kind of MESSAGE_KINDS) {
      const used = (language: (typeof MESSAGE_LANGUAGES)[number]) =>
        MESSAGE_VARIABLES.filter((name) => usesVariable(DEFAULT_TEMPLATES[language][kind], name));
      for (const language of MESSAGE_LANGUAGES) {
        expect(used(language)).toEqual(used('ru'));
        for (const name of used(language)) expect(variablesOf(kind)).toContain(name);
      }
    }
  });
});
