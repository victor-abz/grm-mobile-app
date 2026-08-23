import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ToggleButton } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import { i18n } from '../../../../translations/i18n';
import ListHeader from '../components/ListHeader';
import moment from 'moment';
import { getSessionData } from '../../../../store/ducks/authentication.duck';
import { Issue } from '../../../../models/issues/Issue';
import { IssueStatus } from '../../../../models/issues/IssueStatus';

function Content({
  fetchMoreAssigneeIssueList,
  fetchMoreReporterIssueList,
  fetchMoreResolvedIssueList,
  assigneeIssueList,
  reporterIssueList,
  statuses,
  issueListLoading,
}: {
  fetchMoreReporterIssueList: (completeList?: Issue[]) => Promise<void>;
  fetchMoreAssigneeIssueList: (completeList?: Issue[]) => Promise<void>;
  fetchMoreResolvedIssueList: (completeList?: Issue[]) => Promise<void>;
  assigneeIssueList: Issue[];
  reporterIssueList: Issue[];
  statuses: IssueStatus[];
  issueListLoading: boolean;
}) {
  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState<'reported' | 'assigned' | 'resolved'>('reported');
  const [displayedIssues, setDisplayedIssues] = useState<Issue[]>([]);
  const [userId, setUserId] = useState(null);
  const [currentDate, setCurrentDate] = useState(moment());
  const [isListReady, setIsListReady] = useState(false);
  const issuesListRef = useRef(null);
  const [issueListHeight, setIssueListHeight] = useState(0);

  const sortByUpdatedDateDesc = (data) => {
    return data.sort(function (a, b) {
      return new Date(b.updated_date) - new Date(a.updated_date);
    });
  };

  useEffect(() => {
    if (issuesListRef.current) setIsListReady(true);
  }, [issuesListRef.current]);

  useEffect(() => {
    getSessionData().then((sessionData) => {
      setUserId(sessionData['user_id']);
    });
  }, []);

  useEffect(() => {
    let filteredIssues: Issue[] = [];
    switch (status) {
      case 'assigned':
        filteredIssues = assigneeIssueList ?? [];
        // filteredIssues = sortByCreationDateDesc(filteredIssues);
        break;
      case 'reported':
        filteredIssues = reporterIssueList ?? [];
        // filteredIssues = sortByCreationDateDesc(filteredIssues);
        break;
      case 'resolved':
        const resolvedStatus = statuses.find((el) => el.final_status === true);
        const rejectedStatus = statuses.find((el) => el.rejected_status === true);
        filteredIssues = assigneeIssueList ? [
          ...assigneeIssueList.filter(
            (issue) =>
              issue.assignee &&
              (issue.assignee.id === userId ||
                issue.assignee === userId ||
                String(issue.assignee.id) === String(userId) ||
                String(issue.assignee) === String(userId)
              ) &&
              (issue.status.id === resolvedStatus.id ||
                issue.status.id === rejectedStatus.id ||
                String(issue.status.id) === String(rejectedStatus.id)
              )
          ),
        ] : []
        filteredIssues = sortByUpdatedDateDesc(filteredIssues);
        break;
      default:
        filteredIssues = displayedIssues.map((issue) => issue);
    }
    setDisplayedIssues(filteredIssues);
  }, [userId, status, assigneeIssueList, reporterIssueList]);


  function Item({ item, onPress }) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.item]}>
        <View style={styles.itemContainer}>
          <View style={styles.content}>
            <Text style={[styles.title]}>
              {item.issue_type?.name} - {i18n.t('label_reference')} {item.tracking_code}
            </Text>
            <Text style={[styles.subTitle]} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={[styles.subTitle]}>
              {item.citizen?.name}
              {item.citizen && item.created_date && ','}{' '}
              {item.created_date && moment(item.created_date).format('DD-MMM-YYYY')}
              {item.created_date && ','}{' '}
              {item.created_date && currentDate.diff(item.created_date, 'days')}{' '}
              {i18n.t('days_ago')}
            </Text>
            <Text style={styles.subTitle}>
              {i18n.t('status_label')}:{' '}
              <Text
                style={{
                  color:
                    String(item.status?.id) === String(1) || String(item.status?.id) === String(2)
                      ? colors.inProgress
                      : colors.primary,
                }}
              >
                {item.status?.name}
              </Text>
            </Text>
          </View>
          <View style={styles.proceedIconContainer}>
            <MaterialCommunityIcons name="chevron-right-circle" size={24} color={colors.primary} />
          </View>
        </View>
        {/* <Text style={[styles.title]}>{item.description}</Text> */}
      </TouchableOpacity>
    );
  }

  const renderEmpty = () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{i18n.t('no_results')}</Text>
      </View>
  );

  const renderItem = ({ item }) => {
    const backgroundColor = item.id === selectedId ? '#6e3b6e' : '#f9c2ff';
    const color = item.id === selectedId ? 'white' : 'black';

    const updateIssue = (updatedIssue) => {
      setDisplayedIssues((prevIssues) => {
        const newIssues = prevIssues.map((issue) =>
          issue.id === updatedIssue.id ? updatedIssue : issue
        );
        return newIssues;
      });
    };

    return (
      <Item
        item={item}
        onPress={() => {
          navigation.navigate('IssueDetailTabs', {
            item,
            updateIssue,
            merge: true,
          });
        }}
        backgroundColor={{ backgroundColor }}
        textColor={{ color }}
      />
    );
  };

  const renderHeader = () => <ListHeader status={status} />;
  return (
    <>
      <ToggleButton.Row
        style={{ justifyContent: 'space-between', padding: 10 }}
        onValueChange={(value) => {
          if (value) {
            setStatus(value);
          }
        }}
        value={status}
      >
        <ToggleButton
          style={{
            flex: 1,
            backgroundColor: status === 'reported' ? colors.disabled : colors.white,
            borderBottomColor: status === 'reported' ? colors.primary : colors.white,
            borderBottomWidth: 3,
          }}
          icon={() => (
            <View>
              <Text
                style={{
                  color: status === 'reported' ? colors.primary : colors.secondary,
                  fontWeight: status === 'reported' ? 'bold' : 'normal',
                }}
              >
                {i18n.t('reported')}
              </Text>
            </View>
          )}
          value="reported"
        />
        <ToggleButton
          style={{
            flex: 1,
            backgroundColor: status === 'assigned' ? colors.disabled : colors.white,
            borderBottomColor: status === 'assigned' ? colors.primary : colors.white,
            borderBottomWidth: 3,
          }}
          icon={() => (
            <View>
              <Text
                style={{
                  color: status === 'assigned' ? colors.primary : colors.secondary,
                  fontWeight: status === 'assigned' ? 'bold' : 'normal',
                }}
              >
                {i18n.t('assigned')}
              </Text>
            </View>
          )}
          value="assigned"
        />
        <ToggleButton
          style={{
            flex: 1,
            backgroundColor: status === 'resolved' ? colors.disabled : colors.white,
            borderBottomColor: status === 'resolved' ? colors.primary : colors.white,
            borderBottomWidth: 3,
          }}
          icon={() => (
            <View>
              <Text
                style={{
                  color: status === 'resolved' ? colors.primary : colors.secondary,
                  fontWeight: status === 'resolved' ? 'bold' : 'normal',
                }}
              >
                {i18n.t('resolved')}
              </Text>
            </View>
          )}
          value="resolved"
        />
      </ToggleButton.Row>
      <FlatList
        ref={issuesListRef}
        style={{ flex: 1 }}
        data={displayedIssues}
        ListEmptyComponent={renderEmpty}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={() =>
          issueListLoading && (
            <ActivityIndicator
              style={{ paddingVertical: 20 }}
              color={colors.primary}
              size="small"
            />
          )
        }
        keyExtractor={(item, index) => String(index)}
        bounces={true}
        extraData={selectedId}
        onEndReached={(info) => {
          if (displayedIssues.length > 0 && issueListHeight > 0 && issueListLoading == false) {
            if (status == 'assigned') {
              loadNextPageAssignee(info);
            } else if (status == 'reported') {
              loadNextPageReported(info);
            } else {
              loadNextPageResolved(info);
            }
          }
        }}
        onLayout={(e) => setIssueListHeight(e.nativeEvent.layout.height)}
      />
    </>
  );

  async function loadNextPageReported(info?: { distanceFromEnd: number }) {
    await fetchMoreReporterIssueList(reporterIssueList);
  }

  async function loadNextPageAssignee(info?: { distanceFromEnd: number }) {
    await fetchMoreAssigneeIssueList(assigneeIssueList);
  }
  
  async function loadNextPageResolved(info?: { distanceFromEnd: number }) {
    await fetchMoreResolvedIssueList(assigneeIssueList);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: { flex: 10, paddingRight: 10, justifyContent: 'center' },
  proceedIconContainer: { flexShrink: 0, justifyContent: 'center', alignItems: 'flex-end' },
  item: {
    flex: 1,
    padding: 20,
    paddingBottom: 5,
    marginVertical: 8,
    marginHorizontal: 5,
    borderBottomWidth: 1,
    borderColor: colors.lightgray,
  },
  title: {
    fontFamily: 'Poppins_400Regular',
    // fontSize: 12,
    fontWeight: 'bold',
    fontStyle: 'normal',
    // lineHeight: 10,
    letterSpacing: 0,
    // textAlign: "left",
    color: '#707070',
  },
  subTitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    letterSpacing: 0,
    // textAlign: "left",
    // color: '#707070',
  },
  statisticsText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    fontWeight: 'bold',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'left',
    color: '#707070',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: 'gray',
  },
});

export default Content;