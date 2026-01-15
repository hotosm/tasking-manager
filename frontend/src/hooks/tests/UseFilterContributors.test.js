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
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'ALL',
        'user_3',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('user_3');
  });
  it('with BEGINNER level filter returns the correct contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'BEGINNER',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(2);
    const usernames = contributors.map((c) => c.username);
    expect(usernames).toContain('test_1');
    expect(usernames).toContain('user_5');
  });
  it('with BEGINNER level filter and a beginner username returns 1 contributor', () => {
    const { result } = renderHook(() =>
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'BEGINNER',
        'user_5',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('user_5');
  });
  it('with BEGINNER level filter and an advanced username returns 0 contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'BEGINNER',
        'test',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(0);
  });
  it('with INTERMEDIATE level filter returns the correct contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'INTERMEDIATE',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(2);
    const usernames = contributors.map((c) => c.username);
    expect(usernames).toContain('user_3');
    expect(usernames).toContain('user_4');
  });
  it('with INTERMEDIATE level and an intermediate username filter returns 1 contributor', () => {
    const { result } = renderHook(() =>
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'INTERMEDIATE',
        'user_3',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('user_3');
  });
  it('with INTERMEDIATE level and an beginner username filter returns 0 contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'INTERMEDIATE',
        'user_5',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(0);
  });
  it('with ADVANCED level filter returns the correct contributor', () => {
    const { result } = renderHook(() =>
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'ADVANCED',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('test');
  });
  it('with ADVANCED level filter and an advanced username returns 1 contributor', () => {
    const { result } = renderHook(() =>
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'ADVANCED',
        'test',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('test');
  });
  it('with ADVANCED level filter and an intermediate username returns 0 contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'ADVANCED',
        'user_3',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(0);
  });
  it('with NEWUSER level filter returns 1 contributor', () => {
    const { result } = renderHook(() =>
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'NEWUSER',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('test');
  });
  it('with NEWUSER level filter and an new username returns 1 contributor', () => {
    const { result } = renderHook(() =>
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'NEWUSER',
        'test',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(1);
    expect(contributors[0].username).toEqual('test');
  });
  it('with NEWUSER level filter and an old username returns 0 contributors', () => {
    const { result } = renderHook(() =>
      useFilterContributors(
        projectContributions.userContributions,
        ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
        'NEWUSER',
        'user_3',
      ),
    );
    const contributors = result.current;
    expect(contributors.length).toEqual(0);
  });
});
