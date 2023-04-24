import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { IntlProviders } from '../../../utils/testWithIntl';
import { Imagery } from '../imagery';

describe('Imagery', () => {
  it('with a TMS layer starting with tms[]', () => {
    render(
      <IntlProviders>
        <Imagery
          value={
            'tms[1,22]:https://service.com/earthservice/tms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg'
          }
        />
      </IntlProviders>,
    );
    expect(screen.getByText('Custom TMS Layer')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByRole('img').closest('span').className).toBe(
      'pointer pl2 blue-light hover-blue-dark',
    );
    expect(screen.getByRole('img').closest('span').title).toBe('Copy imagery URL');
  });

  it('with a TMS layer starting with tms:', () => {
    render(
      <IntlProviders>
        <Imagery
          value={'tms:https://service.com/earthservice/tms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg'}
        />
      </IntlProviders>,
    );
    expect(screen.getByText('Custom TMS Layer')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('with a WMS layer starting with wms[]', () => {
    render(
      <IntlProviders>
        <Imagery
          value={
            'wms[1,22]:https://service.com/earthservice/wms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg'
          }
        />
      </IntlProviders>,
    );
    expect(screen.getByText('Custom WMS Layer')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('with a WMTS layer starting with wmts', () => {
    render(
      <IntlProviders>
        <Imagery
          value={
            'wmts[1,22]:https://service.com/earthservice/wms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg'
          }
        />
      </IntlProviders>,
    );
    expect(screen.getByText('Custom WMTS Layer')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('with a custom https layer', () => {
    render(
      <IntlProviders>
        <Imagery value={'https://s3.amazonaws.com/layer/{zoom}/{x}/{y}.jpg'} />
      </IntlProviders>,
    );
    expect(screen.getByText('Custom Layer')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('with a custom http layer', () => {
    render(
      <IntlProviders>
        <Imagery value={'http://s3.amazonaws.com/layer/{zoom}/{x}/{y}.jpg'} />
      </IntlProviders>,
    );
    expect(screen.getByText('Custom Layer')).toBeInTheDocument();
    expect(
      screen.queryByText('http://s3.amazonaws.com/layer/{zoom}/{x}/{y}.jpg'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('with a Mapbox layer', () => {
    render(
      <IntlProviders>
        <Imagery value={'Mapbox'} />
      </IntlProviders>,
    );
    expect(screen.getByText('Mapbox Satellite')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('with a Bing layer', () => {
    render(
      <IntlProviders>
        <Imagery value={'Bing'} />
      </IntlProviders>,
    );
    expect(screen.getByText('Bing')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('with a EsriWorldImagery layer', () => {
    render(
      <IntlProviders>
        <Imagery value={'EsriWorldImagery'} />
      </IntlProviders>,
    );
    expect(screen.getByText('ESRI World Imagery')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('with a EsriWorldImageryClarity layer', () => {
    render(
      <IntlProviders>
        <Imagery value={'EsriWorldImageryClarity'} />
      </IntlProviders>,
    );
    expect(screen.getByText('ESRI World Imagery (Clarity) Beta')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('with a Maxar-Premium layer', () => {
    render(
      <IntlProviders>
        <Imagery value={'Maxar-Premium'} />
      </IntlProviders>,
    );
    expect(screen.getByText('Maxar Premium')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('with a Maxar-Standard layer', () => {
    render(
      <IntlProviders>
        <Imagery value={'Maxar-Standard'} />
      </IntlProviders>,
    );
    expect(screen.getByText('Maxar Standard')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('with a null imagery value', () => {
    render(
      <IntlProviders>
        <Imagery value={null} />
      </IntlProviders>,
    );
    expect(screen.getByText('Any available source')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('with a Mapbox Satellite layer', () => {
    render(
      <IntlProviders>
        <Imagery value={'Mapbox Satellite'} />
      </IntlProviders>,
    );
    expect(screen.getByText('Mapbox Satellite')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('with a Mapbox Satellite layer', () => {
    render(
      <IntlProviders>
        <Imagery value={'Digital Globe'} />
      </IntlProviders>,
    );
    expect(screen.getByText('Digital Globe')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should copy value to the clipboard', async () => {
    const user = userEvent.setup({ writeToClipboard: true });
    render(
      <IntlProviders>
        <Imagery value={'wms'} />
      </IntlProviders>,
    );
    await user.click(screen.getByRole('img'));
    await waitFor(async () => expect(await navigator.clipboard.readText()).toBe('wms'));
  });
});
