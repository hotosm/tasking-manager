import React from 'react';
import TestRenderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';
import { waitFor } from '@testing-library/react';

import {
  ConnectedIntl,
  getTranslatedMessages,
  getSupportedLocale,
  supportedLocales,
} from '../internationalization';
import { isLangSupported } from '../countries';
import { store } from '../../store';

describe('getTranslatedMessages', () => {
  it('with an invalid locale code should return the default locale', async () => {
    expect(typeof (await getTranslatedMessages('xy'))).toBe('object');
    expect(await getTranslatedMessages('xy')).toStrictEqual(await getTranslatedMessages('en'));
  });
  it('with a valid locale code should return a different value than the default locale', async () => {
    expect(await getTranslatedMessages('pt')).not.toEqual(await getTranslatedMessages('en'));
    expect(await getTranslatedMessages('pt-BR')).not.toEqual(await getTranslatedMessages('en'));
  });
});

describe('getSupportedLocale', () => {
  it('returns the exact locale if it is supported', () => {
    expect(getSupportedLocale('pt')).toEqual({ label: 'Português', value: 'pt' });
    expect(getSupportedLocale('pt-BR')).toEqual({ label: 'Português (Brasil)', value: 'pt-BR' });
  });
  it('returns a generic supported locale if the variation is not supported', () => {
    expect(getSupportedLocale('en-gb')).toEqual({ label: 'English', value: 'en' });
    expect(getSupportedLocale('es-AR')).toEqual({ label: 'Español', value: 'es' });
    expect(getSupportedLocale('nl-NL')).toEqual({ label: 'Nederlands', value: 'nl' });
  });
  it('returns the default locale if the code is not supported and does not have a variation', () => {
    expect(getSupportedLocale('xt')).toEqual({ label: 'English', value: 'en' });
  });
});

test('supportedLocales matches with the languages supported by iso-countries-language package', () => {
  const match = supportedLocales.map((locale) => isLangSupported(locale.value));
  expect(match.includes(false)).toBeFalsy();
});

describe('ConnectedIntl component', () => {
  const { act } = TestRenderer;
  it('locale and messages are correctly set to "pt-BR"', async () => {
    act(() => {
      store.dispatch({ type: 'SET_LOCALE', locale: 'pt-BR' });
    });
    const instance = TestRenderer.create(
      <Provider store={store}>
        <ConnectedIntl>
          <span>test</span>
        </ConnectedIntl>
      </Provider>,
    );
    const element = instance.root;
    await waitFor(() => expect(element.findByType(IntlProvider).props.locale).toBe('pt'));
    expect(element.findByType(IntlProvider).props.messages).toStrictEqual(
      await getTranslatedMessages('pt-BR'),
    );
  });

  test('locale and messages are correctly set to "es"', async () => {
    act(() => {
      store.dispatch({ type: 'SET_LOCALE', locale: 'es-AR' });
    });
    const instance = TestRenderer.create(
      <Provider store={store}>
        <ConnectedIntl>
          <span>test</span>
        </ConnectedIntl>
      </Provider>,
    );
    const element = instance.root;
    await waitFor(() => expect(element.findByType(IntlProvider).props.locale).toBe('es'));
    expect(element.findByType(IntlProvider).props.messages).toStrictEqual(
      await getTranslatedMessages('es'),
    );
  });
});
