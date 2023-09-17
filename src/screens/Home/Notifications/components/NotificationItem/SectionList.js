import moment from 'moment';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableHighlight, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SwipeListView } from 'react-native-swipe-list-view';

export default function SectionList({
  id,
  author,
  title,
  description,
  isRead,
  date,
  onItemPress,
  onItemDelete,
}) {
  const { t } = useTranslation();
  const [listData, setListData] = useState(
    Array(1)
      .fill('')
      .map((_, i) => ({
        title: `${title}`,
        data: [
          ...Array(1)
            .fill('')
            .map((_, j) => ({
              key: `${i}.${j}`,
              text: `${description}`,
            })),
        ],
      }))
  );
  const closeRow = (rowMap, rowKey) => {
    if (rowMap[rowKey]) {
      rowMap[rowKey].closeRow();
    }
  };

  const onRowDidOpen = (rowKey) => {
    console.log('This row opened', rowKey);
  };

  const renderItem = () => (
    <TouchableHighlight
      onPress={() => onItemPress({ id, author, title, description })}
      style={styles.rowFront}
      underlayColor="#F5F5F5"
    >
      <View style={{ flexDirection: 'row' }}>
        {(!isRead && (
          <Svg height="50%" width="10%" viewBox="0 0 100 100">
            <Circle cx="50" cy="50" r="12" fill="#24c38b" />
          </Svg>
        )) || <View style={{ width: '10%' }} />}
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle]}>{title}</Text>
          <Text style={[styles.itemDescription]} numberOfLines={2}>
            {description}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.itemAuthorLabel}>
              {t('by_label')}
              {author?.name}
            </Text>
            <Text style={styles.itemDateLabel}>{moment(date).format('LLL')}</Text>
          </View>
        </View>
      </View>
    </TouchableHighlight>
  );

  const renderHiddenItem = (data, rowMap) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => {
          closeRow(rowMap, data.item.key);
          onItemDelete({ id, author, title, description });
        }}
      >
        <Text style={styles.backTextWhite}>{t('delete')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <SwipeListView
        useSectionList
        sections={listData}
        renderItem={renderItem}
        renderHiddenItem={renderHiddenItem}
        leftOpenValue={0}
        rightOpenValue={-75}
        previewRowKey="0"
        previewOpenValue={-40}
        previewOpenDelay={3000}
        onRowDidOpen={onRowDidOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  backTextWhite: {
    color: '#FFF',
  },
  rowFront: {
    // alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomColor: '#dddddd',
    borderBottomWidth: 1,
    paddingRight: 10,
    paddingTop: 5,
    // justifyContent: 'center',
    height: 90,
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 15,
  },
  backRightBtn: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 75,
  },
  backRightBtnLeft: {
    backgroundColor: 'blue',
    right: 75,
  },
  backRightBtnRight: {
    backgroundColor: 'red',
    right: 0,
  },
  itemTitle: {
    fontFamily: 'Poppins_400Regular',
    fontWeight: '700',
    fontStyle: 'normal',
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: 'left',
    color: '#707070',
    fontSize: 13,
  },
  itemDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    lineHeight: 18,
    letterSpacing: 0,
    textAlign: 'left',
    color: '#707070',
  },
  itemAuthorLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'left',
    width: '50%',
  },
  itemDateLabel: {
    fontSize: 11,
    color: '#707070',
    textAlign: 'right',
    width: '50%',
  },
});
