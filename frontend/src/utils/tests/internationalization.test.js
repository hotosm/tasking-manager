import React from 'react';
import TestRenderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import { IntlProvider } from 'react-intl';

import { ConnectedIntl, getTranslatedMessages, getSupportedLocale } from '../internationalization';
import { store } from '../../store';

it('passing a non existante locale code should return the default locale', () => {
  expect(typeof getTranslatedMessages('xy')).toBe('object');
  expect(getTranslatedMessages('xy')).toStrictEqual(getTranslatedMessages('en'));
});
it('passing a non existante locale code should return the default locale', () => {
  expect(getTranslatedMessages('pt')).not.toEqual(getTranslatedMessages('en'));
  expect(getTranslatedMessages('pt-BR')).not.toEqual(getTranslatedMessages('en'));
});

it('get a supported locale', () => {
  expect(getSupportedLocale('pt')).toEqual({ label: 'Português', value: 'pt' });
  expect(getSupportedLocale('pt-BR')).toEqual({ label: 'Português (Brasil)', value: 'pt-BR' });
});

it('get a generic supported locale', () => {
  expect(getSupportedLocale('en-gb')).toEqual({ label: 'English', value: 'en' });
  expect(getSupportedLocale('es-AR')).toEqual({ label: 'Español', value: 'es' });
  expect(getSupportedLocale('nl-NL')).toEqual({ label: 'Nederlands', value: 'nl' });
});
it('get a unsupported locale returns {}', () => {
  expect(getSupportedLocale('xt')).toEqual({ label: 'English', value: 'en' });
});

describe('ConnectedIntl component', () => {
  const { act } = TestRenderer;
  it('locale and messages are correctly set to "pt-BR"', () => {
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
    expect(element.findByType(IntlProvider).props.locale).toBe('pt');
    expect(element.findByType(IntlProvider).props.messages).toStrictEqual(
      getTranslatedMessages('pt-BR'),
    );
  });

  it('locale and messages are correctly set to "es"', () => {
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
    expect(element.findByType(IntlProvider).props.locale).toBe('es');
    expect(element.findByType(IntlProvider).props.messages).toStrictEqual(
      getTranslatedMessages('es'),
    );
  });
});
