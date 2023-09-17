import { MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../../utils/colors';

// definition of the Item, which will be rendered in the FlatList
function Item({ item, onPress }) {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(moment());
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
    </TouchableOpacity>
  );
}

const searchFilter = (issue, searchPhrase, eadl) => {
  if (issue) {
    // ((issue.assignee && issue.assignee.id === eadl?._id) ||
    // (issue.reporter && issue.reporter.id === eadl?._id)) &&
    return (
      issue.tracking_code.includes(searchPhrase.toLowerCase()) ||
      issue.internal_code.includes(searchPhrase.toLowerCase())
    );
  }
  return false;
};

// the filter
function List(props) {
  const renderItem = ({ item }) => {
    if (searchFilter(item, props.searchPhrase, props.eadl)) {
      return (
        <Item
          item={item}
          onPress={() =>
            props.navigation.navigate('IssueDetailTabs', {
              item,
              merge: true,
            })
          }
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.list__container}>
      <View
        onStartShouldSetResponder={() => {
          props.setClicked(false);
        }}
      >
        <FlatList data={props.data} renderItem={renderItem} keyExtractor={(item) => item._id} />
      </View>
    </SafeAreaView>
  );
}

export default List;

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
