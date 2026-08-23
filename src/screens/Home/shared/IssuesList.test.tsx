import React from 'react';
import renderer from 'react-test-renderer';
import IssueList from './IssuesList';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../hooks/issues/useIssue', () => ({
  useIssue: jest.fn(),
}));

jest.mock('../../../hooks/issues/useIssueStatus', () => ({
  useIssueStatus: jest.fn(),
}));

jest.mock('./IssueList.style', () => ({
  styles: () => ({ container: { flex: 1, backgroundColor: 'white' } }),
}));

const mockIssue = ({
  id = '1',
  assignee,
  reporter,
  status,
  tracking_code = 'TC-001',
  description = 'Test issue',
  issue_type = { id: '1', name: 'Complaint' },
  citizen = { name: 'John Doe' },
  created_date = '2025-01-01',
}) => ({ id, assignee, reporter, status, tracking_code, description, issue_type, citizen, created_date });

const statusObject = { id: '1', name: 'Open', final_status: false, rejected_status: false };

describe('IssueList', () => {
  const mockUseSelector = jest.fn();
  const mockUseIssue = jest.fn();
  const mockUseIssueStatus = jest.fn();

  const session = { user_id: 'user-1' };
  const profile = { user: { name: 'Current User' } };

  beforeEach(() => {
    jest.clearAllMocks();

    const { useSelector } = require('react-redux');
    const { useIssue } = require('../../../hooks/issues/useIssue');
    const { useIssueStatus } = require('../../../hooks/issues/useIssueStatus');

    useSelector.mockImplementation(mockUseSelector);
    useIssue.mockImplementation(mockUseIssue);
    useIssueStatus.mockImplementation(mockUseIssueStatus);

    mockUseSelector.mockReturnValue({
      session,
      profile,
    });

    mockUseIssue.mockReturnValue({
      fetchMoreReporterIssueList: jest.fn(),
      fetchMoreAssigneeIssueList: jest.fn(),
      fetchMoreResolvedIssueList: jest.fn(),
      loading: false,
    });

    mockUseIssueStatus.mockReturnValue({
      issueStatusList: [statusObject],
      getStatusById: jest.fn().mockReturnValue(statusObject),
    });
  });

  it('renders without crashing when no lists provided', () => {
    const { useIssue } = require('../../../hooks/issues/useIssue');
    useIssue.mockImplementation(() => ({
      fetchMoreReporterIssueList: jest.fn(),
      fetchMoreAssigneeIssueList: jest.fn(),
      fetchMoreResolvedIssueList: jest.fn(),
      loading: false,
    }));

    const tree = renderer.create(<IssueList />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders with empty arrays', () => {
    const tree = renderer.create(<IssueList assigneeIssueList={[]} reporterIssueList={[]} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('resolves string assignee matching session user_id to object', () => {
    const assigneeIssueList = [
      mockIssue({ id: '1', assignee: 'user-1', reporter: { id: 'other' }, status: statusObject }),
    ];

    renderer.create(
      <IssueList assigneeIssueList={assigneeIssueList} reporterIssueList={[]} />
    );

    expect(assigneeIssueList[0].assignee).toEqual({ id: 'user-1', name: 'Current User' });
  });

  it('resolves string reporter matching session user_id to object', () => {
    const reporterIssueList = [
      mockIssue({ id: '1', assignee: { id: 'other' }, reporter: 'user-1', status: statusObject }),
    ];

    renderer.create(
      <IssueList assigneeIssueList={[]} reporterIssueList={reporterIssueList} />
    );

    expect(reporterIssueList[0].reporter).toEqual({ id: 'user-1', name: 'Current User' });
  });

  it('resolves string status via getStatusById', () => {
    const assigneeIssueList = [
      mockIssue({ id: '1', assignee: { id: 'other' }, reporter: { id: 'other' }, status: 'status-1' }),
    ];

    renderer.create(
      <IssueList assigneeIssueList={assigneeIssueList} reporterIssueList={[]} />
    );

    expect(assigneeIssueList[0].status).toEqual(statusObject);
  });

  it('passes loading state to IssueListView', () => {
    const { useIssue } = require('../../../hooks/issues/useIssue');
    useIssue.mockImplementation(() => ({
      fetchMoreReporterIssueList: jest.fn(),
      fetchMoreAssigneeIssueList: jest.fn(),
      fetchMoreResolvedIssueList: jest.fn(),
      loading: true,
    }));

    const tree = renderer.create(<IssueList assigneeIssueList={[]} reporterIssueList={[]} />);
    const root = tree.root;

    const issueListView = root.findByProps({ issueListLoading: true });
    expect(issueListView).toBeDefined();
  });
});
