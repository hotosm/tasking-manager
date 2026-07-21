import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';

import {
  ViewAllLink,
  AddButton,
  DeleteButton,
  VisibilityBox,
  JoinMethodBox,
  Management,
} from '../components/teamsAndOrgs/management';

const Wrapper = ({ children }) => (
  <IntlProvider locale="en">
    <MemoryRouter>{children}</MemoryRouter>
  </IntlProvider>
);

describe('teamsAndOrgs management components', () => {
  describe('ViewAllLink', () => {
    it('renders with link', () => {
      render(<ViewAllLink link="/all" />, { wrapper: Wrapper });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/all');
      expect(screen.getByText(/view all/i)).toBeInTheDocument();
    });
  });

  describe('AddButton', () => {
    it('renders correctly', () => {
      render(<AddButton />, { wrapper: Wrapper });
      expect(screen.getByText(/new/i)).toBeInTheDocument();
    });
  });

  describe('DeleteButton', () => {
    it('renders and handles click', () => {
      const onClick = jest.fn();
      render(<DeleteButton onClick={onClick} />, { wrapper: Wrapper });
      const btn = screen.getByRole('button');
      fireEvent.click(btn);
      expect(onClick).toHaveBeenCalled();
      expect(screen.getByText(/delete/i)).toBeInTheDocument();
    });

    it('hides text when showText is false', () => {
      render(<DeleteButton onClick={jest.fn()} showText={false} />, { wrapper: Wrapper });
      expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
    });
  });

  describe('VisibilityBox', () => {
    it('renders public visibility', () => {
      render(<VisibilityBox visibility="PUBLIC" />, { wrapper: Wrapper });
      expect(screen.getByText(/public/i)).toBeInTheDocument();
    });

    it('renders private visibility', () => {
      render(<VisibilityBox visibility="PRIVATE" />, { wrapper: Wrapper });
      expect(screen.getByText(/private/i)).toBeInTheDocument();
    });
  });

  describe('JoinMethodBox', () => {
    it('renders ANY join method', () => {
      render(<JoinMethodBox joinMethod="ANY" />, { wrapper: Wrapper });
      expect(screen.getByText(/anyone can join/i)).toBeInTheDocument();
    });

    it('renders BY_REQUEST join method', () => {
      render(<JoinMethodBox joinMethod="BY_REQUEST" />, { wrapper: Wrapper });
      expect(screen.getByText(/by request/i)).toBeInTheDocument();
    });
  });

  describe('Management', () => {
    it('renders correctly with default props', () => {
      render(
        <Management title="My Title" showAddButton={true}>
          <div data-testid="child-element" />
        </Management>,
        { wrapper: Wrapper }
      );
      expect(screen.getByText('My Title')).toBeInTheDocument();
      expect(screen.getByText(/new/i)).toBeInTheDocument();
      expect(screen.getByTestId('child-element')).toBeInTheDocument();
    });

    it('renders admin toggle buttons when isAdmin is true', () => {
      const setUserOnly = jest.fn();
      render(
        <Management title="My Title" isAdmin={true} userOnly={false} setUserOnly={setUserOnly} userOnlyLabel="My Teams" />,
        { wrapper: Wrapper }
      );
      const allBtn = screen.getByRole('button', { name: /all/i });
      const myTeamsBtn = screen.getByRole('button', { name: /My Teams/i });
      
      expect(allBtn).toBeInTheDocument();
      expect(myTeamsBtn).toBeInTheDocument();

      fireEvent.click(myTeamsBtn);
      expect(setUserOnly).toHaveBeenCalledWith(true);

      fireEvent.click(allBtn);
      expect(setUserOnly).toHaveBeenCalledWith(false);
    });
  });
});
