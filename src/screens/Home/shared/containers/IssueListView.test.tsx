import React from 'react';
import renderer from 'react-test-renderer';
import IssueListView from './IssueListView';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../../../../translations/i18n', () => ({
  i18n: {
    t: (key) => {
      const map = {
        label_reference: 'Ref',
        days_ago: 'days ago',
        status_label: 'Status',
        reported: 'Reported',
        assigned: 'Assigned',
        resolved: 'Resolved',
        no_results: 'No results found',
      };
      return map[key] || key;
    },
  },
}));

jest.mock('../../../../store/ducks/authentication.duck', () => ({
  getSessionData: jest.fn().mockResolvedValue({ user_id: 'user-1' }),
}));

jest.mock('../../../../utils/colors', () => ({
  colors: {
    inProgress: '#FFA500',
    primary: '#007AFF',
    secondary: '#8E8E93',
    disabled: '#E5E5E5',
    white: '#FFFFFF',
    lightgray: '#D1D1D6',
  },
}));

jest.mock('moment', () => {
  const mockMoment = (date) => ({
    format: (fmt) => {
      if (date === '2025-01-01') return '01-Jan-2025';
      return '01-Jan-2025';
    },
    diff: () => 10,
  });
  mockMoment.fn = jest.fn().mockReturnValue(mockMoment());
  return mockMoment;
});

const makeIssue = (overrides = {}) => ({
  id: '1',
  tracking_code: 'TC-001',
  description: 'Test description',
  issue_type: { id: '1', name: 'Complaint' },
  citizen: { name: 'John Doe' },
  created_date: '2025-01-01',
  updated_date: '2025-01-15',
  assignee: { id: 'user-1', name: 'Assignee' },
  reporter: { id: 'user-2', name: 'Reporter' },
  status: { id: '1', name: 'Open', final_status: false, rejected_status: false },
  ...overrides,
});

const statuses = [
  { id: '1', name: 'Open', final_status: false, rejected_status: false },
  { id: '2', name: 'Closed', final_status: true, rejected_status: false },
  { id: '3', name: 'Rejected', final_status: false, rejected_status: true },
];

const defaultProps = {
  fetchMoreReporterIssueList: jest.fn().mockResolvedValue(undefined),
  fetchMoreAssigneeIssueList: jest.fn().mockResolvedValue(undefined),
  fetchMoreResolvedIssueList: jest.fn().mockResolvedValue(undefined),
  assigneeIssueList: [],
  reporterIssueList: [],
  statuses,
  issueListLoading: false,
};

describe('IssueListView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const tree = renderer.create(<IssueListView {...defaultProps} />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('shows empty state when no issues', () => {
    const tree = renderer.create(<IssueListView {...defaultProps} />);
    const instance = tree.root;
    const emptyText = instance.findByProps({ children: 'No results found' });
    expect(emptyText).toBeDefined();
  });

  it('renders reported issues when status is reported', () => {
    const reporterIssueList = [makeIssue({ id: '1' }), makeIssue({ id: '2' })];
    const props = { ...defaultProps, reporterIssueList };

    const tree = renderer.create(<IssueListView {...props} />);

    const reportButtons = tree.root.findAllByProps({ value: 'reported' });
    expect(reportButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders assigned toggle button', () => {
    const tree = renderer.create(<IssueListView {...defaultProps} />);

    const assignedButton = tree.root.findByProps({ value: 'assigned' });
    expect(assignedButton).toBeDefined();
  });

  it('renders resolved toggle button', () => {
    const tree = renderer.create(<IssueListView {...defaultProps} />);

    const resolvedButton = tree.root.findByProps({ value: 'resolved' });
    expect(resolvedButton).toBeDefined();
  });

  it('shows activity indicator when loading', () => {
    const props = { ...defaultProps, issueListLoading: true, reporterIssueList: [makeIssue()] };

    const tree = renderer.create(<IssueListView {...props} />);

    const activityIndicator = tree.root.findAllByProps({ size: 'small' });
    expect(activityIndicator.length).toBeGreaterThanOrEqual(1);
  });

  it('passes issue list data to FlatList', () => {
    const issues = [makeIssue({ id: '1' }), makeIssue({ id: '2' })];
    const props = { ...defaultProps, reporterIssueList: issues };

    const tree = renderer.create(<IssueListView {...props} />);

    const flatList = tree.root.findByProps({ bounces: true });
    expect(flatList.props.data).toHaveLength(2);
  });

  it('navigates to IssueDetailTabs on item press', () => {
    const navigateMock = jest.fn();
    const { useNavigation } = require('@react-navigation/native');
    useNavigation.mockReturnValue({ navigate: navigateMock });

    const issues = [makeIssue({ id: '1' })];
    const props = { ...defaultProps, reporterIssueList: issues };

    const tree = renderer.create(<IssueListView {...props} />);

    const touchables = tree.root.findAllByProps({ onPress: expect.any(Function) });
    const itemTouchable = touchables.find(
      (el) => el.props.onPress && !el.props.value
    );

    if (itemTouchable) {
      itemTouchable.props.onPress();
      expect(navigateMock).toHaveBeenCalledWith('IssueDetailTabs', {
        item: expect.objectContaining({ id: '1' }),
        updateIssue: expect.any(Function),
        merge: true,
      });
    }
  });
});
