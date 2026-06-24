import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LevelCard, LevelsManagement, LevelInformation, LevelForm } from '../index';
import { IntlProviders, renderWithRouter } from '../../../utils/testWithIntl';

describe('Level Components', () => {
  it('LevelCard renders correctly', () => {
    renderWithRouter(
      <IntlProviders>
        <LevelCard level={{ id: 1, name: 'Beginner' }} number={1} />
      </IntlProviders>
    );
    expect(screen.getByText('1. Beginner')).toBeInTheDocument();
  });

  it('LevelsManagement renders correctly with data', () => {
    renderWithRouter(
      <IntlProviders>
        <LevelsManagement levels={[{ id: 1, name: 'Beginner' }]} isFetched={true} />
      </IntlProviders>
    );
    expect(screen.getByText('1. Beginner')).toBeInTheDocument();
  });

  it('LevelsManagement renders correctly without data', () => {
    renderWithRouter(
      <IntlProviders>
        <LevelsManagement levels={[]} isFetched={true} />
      </IntlProviders>
    );
    expect(screen.getByText('No levels found.')).toBeInTheDocument();
  });

  it('LevelForm renders correctly and handles changes', async () => {
    const updateLevelMock = jest.fn();
    const badges = [{ id: 1, name: 'Badge 1' }, { id: 2, name: 'Badge 2' }];
    
    renderWithRouter(
      <IntlProviders>
        <LevelForm level={{ name: 'Intermediate', approvalsRequired: '0', color: '#000000', requiredBadges: [], isBeginner: false }} badges={badges} updateLevel={updateLevelMock} />
      </IntlProviders>
    );

    expect(screen.getByDisplayValue('Intermediate')).toBeInTheDocument();
    
    // Toggle switch
    const switchEl = screen.getByRole('checkbox', { name: /Peer review/i });
    fireEvent.click(switchEl);

    await waitFor(() => {
      // approvals_required input should appear
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    const numInput = screen.getByRole('spinbutton');
    fireEvent.change(numInput, { target: { value: '2' } });

    // Submit form
    // Let's trigger a submit by changing a field and clicking Save
    const nameInput = screen.getByDisplayValue('Intermediate');
    fireEvent.change(nameInput, { target: { value: 'Advanced' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(updateLevelMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Advanced', approvalsRequired: '2' }));
    });
  });

  it('LevelForm Add/Remove Badges', async () => {
    const updateLevelMock = jest.fn();
    const badges = [{ id: 1, name: 'Badge 1' }, { id: 2, name: 'Badge 2' }];
    
    renderWithRouter(
      <IntlProviders>
        <LevelForm level={{ name: 'Intermediate', approvalsRequired: '0', color: '#000000', requiredBadges: [{ id: 1, name: 'Badge 1' }], isBeginner: false }} badges={badges} updateLevel={updateLevelMock} />
      </IntlProviders>
    );

    expect(screen.getByText('Badge 1')).toBeInTheDocument();
    
    // remove badge
    const removeBtn = document.querySelector('button.pa0.pointer.ba.bg-transparent'); 
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Badge 1')).not.toBeInTheDocument();
    });
  });
});
