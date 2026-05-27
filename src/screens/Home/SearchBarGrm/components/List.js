import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
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
import dayjs from '../../../../utils/dayjs';
import { colors } from '../../../../utils/colors';

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
  list__container: {
    margin: 10,
    height: '85%',
    width: '95%',
  },
});

// definition of the Item, which will be rendered in the FlatList
const Item = ({ item, onPress }) => {
  const { t } = useTranslation();
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
            {item.citizen}, {item.intake_date && dayjs(item.intake_date).format('DD-MMM-YYYY')}
            ,{' '}
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
};

const searchFilter = (issue, searchPhrase) => {
  if (issue) {
    const phrase = searchPhrase.toLowerCase();
    return (
      issue.tracking_code?.includes(phrase) ||
      false ||
      issue.internal_code?.includes(phrase) ||
      false
    );
  }
  return false;
};

// the filter
const List = ({ searchPhrase, eadl, navigation, setClicked, data }) => {
  const renderItem = ({ item }) => {
    if (searchFilter(item, searchPhrase, eadl)) {
      return (
        <Item
          item={item}
          onPress={() =>
            navigation.navigate('IssueDetailTabs', {
              item,
              merge: true,
            })
          }
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.list__container}>
      <View
        onStartShouldSetResponder={() => {
          setClicked(false);
        }}
      >
        <FlatList data={data} renderItem={renderItem} keyExtractor={(item) => item._id} />
      </View>
    </SafeAreaView>
  );
};

export default List;
