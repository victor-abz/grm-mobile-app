import { StyleSheet, Text, View } from 'react-native';
import i18n from 'i18n-js';
import * as PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../../../../utils/colors';

export default function ListHeader(props) {
  return (
    <View>
      <View style={{ paddingLeft: 15 }}>
        <Text style={styles.listHeader}>
          {i18n.t('your_issues_label')}{' '}{props.status ? i18n.t(props.status) : ''}
        </Text>
      </View>
    </View>
  );
}

ListHeader.propTypes = {
  status: PropTypes.any,
};

const styles = StyleSheet.create({
  summaryContainer: {
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowRadius: 15,
    shadowOpacity: 1,
    margin: 10,
    padding: 15,
  },
  container: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  listHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'left',
    color: colors.primary,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightgray,
    textTransform: 'uppercase'
  },
  statisticsText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    fontWeight: 'bold',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'left',
    color: '#707070',
    lineHeight: 18,
    width: '80%'
  },
  statisticsValueDanger: {
    color: '#ef6a78',
    width: '20%',
    textAlign: 'center'
  },
  statisticsValuePrimary: {
    color: colors.primary,
    width: '20%',
    textAlign: 'center'
  }
});
