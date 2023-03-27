import { renderHook } from '@testing-library/react';

import { useFilterContributors } from '../UseFilterContributors';
import { projectContributions } from '../../network/tests/mockData/contributions';

describe('test if useFilterContributors', () => {
  it('without level and username filters returns all contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(projectContributions.userContributions.length);
  });
  it('with ALL level filter returns all contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'ALL'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(projectContributions.userContributions.length);
  });
  it('with ALL level and a username filter returns only that username', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'ALL', 'user_3'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('user_3');
  });
  it('with BEGINNER level filter returns 2 contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'BEGINNER'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(2);
  });
  it('with BEGINNER level filter and a beginner username returns 1 contributor', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'BEGINNER', 'user_5'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('user_5');
  });
  it('with BEGINNER level filter and an advanced username returns 0 contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'BEGINNER', 'test'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(0);
  });
  it('with INTERMEDIATE level filter returns 2 contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'INTERMEDIATE'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(2);
  });
  it('with INTERMEDIATE level and an intermediate username filter returns 1 contributor', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'INTERMEDIATE', 'user_3'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('user_3');
  });
  it('with INTERMEDIATE level and an beginner username filter returns 0 contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'INTERMEDIATE', 'user_5'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(0);
  });
  it('with ADVANCED level filter returns 1 contributor', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'ADVANCED'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
  });
  it('with ADVANCED level filter and an advanced username returns 1 contributor', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'ADVANCED', 'test'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('test');
  });
  it('with ADVANCED level filter and an intermediate username returns 0 contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'ADVANCED', 'user_3'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(0);
  });
  it('with NEWUSER level filter returns 1 contributor', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'NEWUSER'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('test');
  });
  it('with NEWUSER level filter and an new username returns 1 contributor', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'NEWUSER', 'test'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('test');
  });
  it('with NEWUSER level filter and an old username returns 0 contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(projectContributions.userContributions, 'NEWUSER', 'user_3'),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(0);
  });
});
