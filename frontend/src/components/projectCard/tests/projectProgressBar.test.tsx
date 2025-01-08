import ProjectProgressBar from '../projectProgressBar';
import { createComponentWithIntl, IntlProviders } from '../../../utils/testWithIntl';
import { render, screen } from '@testing-library/react';

describe('test if projectProgressBar', () => {
  const setup = () => render(
    <IntlProviders>
      <ProjectProgressBar className="pb2" percentMapped={40} percentValidated={25} />
    </IntlProviders>
  );
  it('mapped bar has the correct width', async () => {
    const { container } = setup();
    const element = container.querySelector('.absolute.bg-blue-grey.br-pill.hhalf.hide-child') as HTMLDivElement;
    expect(element).toBeInTheDocument();
    expect(element.style.width).toBe('40%');
  });
  it('validated bar has the correct width', () => {
    const { container } = setup();
    const element = container.querySelector('.absolute.bg-red.br-pill.hhalf.hide-child') as HTMLDivElement;
    expect(element).toBeInTheDocument();
    expect(element.style.width).toBe('25%');
  });
  it('has a div with the complete background bar', () => {
    const { container } = setup();
    const element = container.querySelector('.bg-tan.br-pill.hhalf.overflow-y-hidden') as HTMLDivElement;
    expect(element).toBeInTheDocument();
  });
  it('the first div has the correct classes', () => {
    const { container } = setup();
    const element = container.querySelector('.cf.db.pb2') as HTMLDivElement;
    expect(element).toBeInTheDocument();
    expect(element.className).toBe('cf db pb2');
  });
  it('tooltip is not present because it is not hovered', async () => {
    const { container } = setup();
    const element = container.querySelector(".db.absolute.top-1.z-1.dib.bg-blue-dark.ba.br2.b--blue-dark.pa2.shadow-5") as HTMLDivElement;
    expect(element).not.toBeInTheDocument();
    expect(container.getElementsByTagName("span").length).toBe(0);
  });
});

describe('test if projectProgressBar with value higher than 100%', () => {
  const setup = () => render(
    <IntlProviders>
      <ProjectProgressBar className="pb2" percentMapped={140} percentValidated={125} />,
    </IntlProviders>
  );
  it('to mapped returns 100% width', () => {
    const { container } = setup();
    const element = container.querySelector('.absolute.bg-blue-grey.br-pill.hhalf.hide-child') as HTMLDivElement;
    expect(element).toBeInTheDocument();
    expect(element.style.width).toBe('100%');
  });
  it('to validated returns 100% width', () => {
    const { container } = setup();
    const element = container.querySelector('.absolute.bg-red.br-pill.hhalf.hide-child') as HTMLDivElement;
    expect(element).toBeInTheDocument();
    expect(element.style.width).toBe('100%');
  });
});
