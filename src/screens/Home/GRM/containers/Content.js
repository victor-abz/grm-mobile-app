import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SmallCard from '../components/SmallCard';
import BigCard from '../components/BigCard';
import Chart from '../../../../../assets/chart_line_solid.svg';
import FileIcon from '../../../../../assets/file_alt_regular.svg';
import TeamWorkIcon from '../../../../../assets/team-work.svg';
import SyncIcon from '../../../../../assets/sync_alt_solid.svg';
import { i18n } from '../../../../translations/i18n';
import { useSelector } from 'react-redux';
import CustomLoadingSpinner from '../../../../components/CustomLoadingSpinner/CustomLoadingSpinner';
import { colors } from '../../../../utils/colors';

function Content() {
  const navigation = useNavigation();
  const { globalLoading } = useSelector((state) => state.get('global').toObject());

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 20,
          paddingBottom: 40,
          paddingHorizontal: 18,
          justifyContent: 'space-between',
          backgroundColor: 'white',
        }}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {globalLoading && (
          <View style={{ paddingVertical: 10 }}>
            <CustomLoadingSpinner />
          </View>
        )}

        <View style={{ flex: 1, justifyContent: 'flex-start' }}>
          <BigCard
            image={require('../../../../../assets/BG_9.png')}
            onCardPress={() => {
              if (!globalLoading) {
                navigation.navigate('CitizenReportIntro');
              }
            }}
            title={i18n.t('collect_reports')}
            icon={<TeamWorkIcon />}
            style={{
              marginBottom: 18,
              minHeight: 130,
              width: '100%',
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          />

          <BigCard
            image={require('../../../../../assets/purpleBg.png')}
            onCardPress={() => navigation.navigate('IssueSearch')}
            title={i18n.t('search_reports')}
            icon={<SyncIcon />}
            style={{
              marginBottom: 18,
              minHeight: 130,
              width: '100%',
              borderRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          />
        </View>
        <View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: '#999999',
                fontSize: 15,
                fontWeight: 'bold',
                padding: 15,
                textTransform: 'uppercase',
                borderBottomWidth: 1,
                borderBottomColor: colors.lightgray,
              }}
            >
              {i18n.t('account_insights')}
            </Text>
          </View>

          {/* Separator */}
          <View style={{ width: '100%', height: 1, backgroundColor: '#E5E7EB', marginBottom: 8 }} />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 12,
              borderRadius: 20,
              backgroundColor: '#F3F4F6', // a soft modern gray, subtle lift from white

              padding: 12,
              alignItems: 'center',
              minHeight: 110,
              width: '100%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
              elevation: 2,
            }}
          >
            <SmallCard
              image={require('../../../../../assets/BG_1.png')}
              onCardPress={() => navigation.navigate('Statistics')}
              title={i18n.t('diagnostics')}
              icon={<Chart />}
              style={{
                flex: 1,
                marginRight: 8,
                minWidth: 130,
                borderRadius: 14,
                backgroundColor: 'white',
                elevation: 1,
              }}
            />
            <SmallCard
              image={require('../../../../../assets/BG_2.png')}
              onCardPress={() => alert('Upcoming feature')}
              title={i18n.t('information')}
              icon={<FileIcon />}
              style={{
                flex: 1,
                marginLeft: 8,
                minWidth: 130,
                borderRadius: 14,
                backgroundColor: 'white',
                elevation: 1,
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default Content;
