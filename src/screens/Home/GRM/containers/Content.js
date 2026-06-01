import React from 'react';
import { View, ScrollView, Text, Dimensions } from 'react-native';
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

function Content() {
  const navigation = useNavigation();
  const { globalLoading } = useSelector((state) => state.get('global').toObject());

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View
        style={{
          elevation: 0,
          borderBottomColor: '#E5E7EB',
          borderBottomWidth: 1,
        }}
      >
        <Text
          style={{
    letterSpacing: 0.2,
    paddingVertical: 12,
    fontSize: Dimensions.get('window').width < 400 ? 18 : 22,
    fontWeight: '500',
    color: 'rgb(28,28,30,.99)',
    paddingHorizontal: 25,
  }}
        >
          {i18n.t('dashboard')}
        </Text>
      </View>
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
              minHeight: Dimensions.get('window').width < 400 ? 130 : 160,

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
              minHeight: Dimensions.get('window').width < 400 ? 130 : 160,
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
          <View style={{ flex: 1, marginTop: Dimensions.get('window').width < 400 ? 0 : 50 }}>
            <Text
              style={{
                color: '#999999',
                fontSize: 15,
                fontWeight: 'bold',
                paddingHorizontal: 15,
                paddingTop: 25,
                paddingBottom: 0,
                textTransform: 'uppercase',
              }}
            >
              {i18n.t('account_insights')}
            </Text>
          </View>

          {/* Separator */}
          {/* <View style={{ width: '100%', height: 1, backgroundColor: '#E5E7EB', marginBottom: 8 }} /> */}

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 12,
              borderRadius: 20,
              padding: 6,
              alignItems: 'center',
              minHeight: 110,
              width: '100%',
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
          {/* <View style={{ width: '100%', height: 1, backgroundColor: '#E5E7EB', marginBottom: 8 }} /> */}
        </View>
      </ScrollView>
    </View>
  );
}

export default Content;
