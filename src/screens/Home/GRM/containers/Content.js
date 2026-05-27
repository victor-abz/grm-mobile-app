import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { logger } from '../../../../utils/logger';
import Chart from '../../../../../assets/chart_line_solid.svg';
import SearchIcon from '../../../../../assets/magnifying-glass-solid.svg';
import SyncIcon from '../../../../../assets/sync_alt_solid.svg';
import TeamWorkIcon from '../../../../../assets/team-work.svg';
import BG9 from '../../../../../assets/BG_9.webp';
import purpleBg from '../../../../../assets/purpleBg.webp';
import smallRectangle from '../../../../../assets/small-rectangle.webp';
import BG1 from '../../../../../assets/BG_1.webp';
import BigCard from '../components/BigCard';

const Content = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Log screen load
  useEffect(() => {
    logger.userAction('screen_load', 'GRM');
  }, []);

  return (
    <ScrollView contentContainerStyle={{ paddingTop: 20 }} style={{ backgroundColor: 'white' }}>
      <BigCard
        image={BG9}
        onCardPress={() => {
          logger.userAction('grm_collect_reports', 'GRM');
          navigation.navigate('CitizenReportIntro');
        }}
        title={t('collect_reports')}
        icon={<TeamWorkIcon />}
      />
      <View style={{ marginVertical: 20 }}>
        <BigCard
          image={purpleBg}
          onCardPress={() => {
            logger.userAction('grm_search_reports', 'GRM');
            navigation.navigate('IssueSearch');
          }}
          title={t('search_reports')}
          icon={
            <View style={{ padding: 15 }}>
              <SearchIcon />
            </View>
          }
        />
      </View>
      <BigCard
        image={smallRectangle}
        onCardPress={() => {
          logger.userAction('grm_sync_files', 'GRM');
          navigation.navigate('SyncAttachments');
        }}
        title={t('sync_files')}
        icon={<SyncIcon />}
        // cardHeight={79}
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          marginVertical: 20,
          borderRadius: 15,
        }}
      >
        <BigCard
          image={BG1}
          onCardPress={() => {
            logger.userAction('grm_view_statistics', 'GRM');
            navigation.navigate('Statistics');
          }}
          title={t('View Report')}
          icon={<Chart />}
          // cardHeight={79}
        />
      </View>
    </ScrollView>
  );
};

export default Content;
