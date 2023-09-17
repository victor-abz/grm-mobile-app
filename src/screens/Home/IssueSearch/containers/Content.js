import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ToggleButton } from 'react-native-paper';
import { colors } from '../../../../utils/colors';
import ListHeader from '../components/ListHeader';

function Content({ issues, eadl, statuses }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('assigned');
  const [_issues, setIssues] = useState([]);
  const [currentDate, setCurrentDate] = useState(moment());

  const sortByCreationDateDesc = (data) =>
    data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  useEffect(() => {
    setIssues(issues);
  }, []);

  useEffect(() => {
    let filteredIssues = [];
    let foundStatus;

    switch (status) {
      case 'assigned':
        foundStatus = statuses.find((el) => el.final_status === true);
        filteredIssues = issues.filter(
          (issue) =>
            issue.assignee && issue.assignee.id === eadl?._id && issue.status.id !== foundStatus?.id
        );
        filteredIssues = sortByCreationDateDesc(filteredIssues);
        break;
      case 'open':
        foundStatus = statuses.find((el) => el.final_status === true);
        filteredIssues = issues.filter(
          (issue) =>
            ((issue.assignee && issue.assignee.id === eadl?._id) ||
              (issue.reporter && issue.reporter.id === eadl?._id)) &&
            issue.status.id !== foundStatus?.id
        );
        filteredIssues = sortByCreationDateDesc(filteredIssues);
        break;
      case 'resolved':
        foundStatus = statuses.find((el) => el.final_status === true);
        filteredIssues = issues.filter(
          (issue) =>
            ((issue.assignee && issue.assignee.id === eadl?._id) ||
              (issue.reporter && issue.reporter.id === eadl?._id)) &&
            issue.status.id === foundStatus.id
        );
        filteredIssues = sortByCreationDateDesc(filteredIssues);
        break;
      default:
        filteredIssues = _issues.map((issue) => issue);
    }
    setIssues(filteredIssues);
  }, [status]);

  function Item({ item, onPress, backgroundColor, textColor }) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.item]}>
        <View style={styles.itemContainer}>
          <View>
            <Text style={[styles.title]}>
              {item.issue_type?.name} - {t('label_reference')} {item.tracking_code}
            </Text>
            <Text style={[styles.subTitle]} numberOfLines={1}>
              {item.title ? item.title : item.description}
            </Text>
            <Text style={[styles.subTitle]}>
              {item.citizen}, {item.intake_date && moment(item.intake_date).format('DD-MMM-YYYY')},{' '}
              {item.intake_date && currentDate.diff(item.intake_date, 'days')} {t('days_ago')}
            </Text>
            <Text style={styles.subTitle}>
              {t('status_label')}:{' '}
              <Text
                style={{
                  color:
                    item.status?.id === 1 || item.status?.id === 2
                      ? colors.inProgress
                      : colors.primary,
                }}
              >
                {item.status?.name}
              </Text>
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right-circle" size={24} color={colors.primary} />
        </View>
        {/* <Text style={[styles.title]}>{item.description}</Text> */}
      </TouchableOpacity>
    );
  }

  const renderItem = ({ item }) => {
    const backgroundColor = item.id === selectedId ? '#6e3b6e' : '#f9c2ff';
    const color = item.id === selectedId ? 'white' : 'black';

    return (
      <Item
        item={item}
        onPress={() =>
          navigation.navigate('IssueDetailTabs', {
            item,
            merge: true,
          })
        }
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
            backgroundColor: status === 'open' ? colors.disabled : colors.white,
            borderBottomColor: status === 'open' ? colors.primary : colors.white,
            borderBottomWidth: 3,
          }}
          icon={() => (
            <View>
              <Text
                style={{
                  color: status === 'open' ? colors.primary : colors.secondary,
                  fontWeight: status === 'open' ? 'bold' : 'normal',
                }}
              >
                {t('open')}
              </Text>
            </View>
          )}
          value="open"
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
                {t('assigned')}
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
                {t('resolved')}
              </Text>
            </View>
          )}
          value="resolved"
        />
      </ToggleButton.Row>
      <FlatList
        style={{ flex: 1 }}
        data={_issues}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        keyExtractor={(item) => item._id}
        extraData={selectedId}
      />
    </>
  );
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
});

export default Content;
