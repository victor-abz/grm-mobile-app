import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Dimensions, Image, ImageBackground, ScrollView, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../../../providers/DataProvider';
import BigCard from '../components/BigCard';
import SmallCard from '../components/SmallCard';
import Chart from '../../../../../assets/chart_line_solid.svg';
import FileIcon from '../../../../../assets/file_alt_regular.svg';
import SyncIcon from '../../../../../assets/sync_alt_solid.svg';
import TeamWorkIcon from '../../../../../assets/team-work.svg';
import group8043 from '../../../../../assets/drawable-xhdpi/group_8043.webp';
import group2 from '../../../../../assets/drawable-xhdpi/group_2.webp';
import BG1 from '../../../../../assets/BG_1.webp';
import BG2 from '../../../../../assets/BG_2.webp';
import BG9 from '../../../../../assets/BG_9.webp';
import smallRectangle from '../../../../../assets/small-rectangle.webp';
import lookupDataManager from '../../../../services/LookupDataManager';
import dataManager from '../../../../services/DataManager';
import { logger } from '../../../../utils/logger';

const screenWidth = Dimensions.get('window').width;

const Content = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { performNuclearReset } = useData();
  const [isResetting, setIsResetting] = useState(false);

  // Trigger background sync when home page loads
  useEffect(() => {
    logger.userAction('screen_load', 'Dashboard/Content');

    const triggerBackgroundSync = async () => {
      try {
        logger.info('Dashboard: Starting background sync');
        await lookupDataManager.performBackgroundSync();
        logger.info('Dashboard: Background sync completed successfully');
      } catch (error) {
        logger.warn('Dashboard: Background sync failed', error);
      }
    };

    // Trigger sync after a short delay to not block initial render
    const timer = setTimeout(triggerBackgroundSync, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Sync pending changes on Home page load
  useEffect(() => {
    const syncPendingChanges = async () => {
      try {
        const syncStatus = await dataManager.getSyncStatus();
        logger.info('Dashboard: Pending changes on load', {
          pendingChanges: syncStatus.pendingChanges,
        });
        if (syncStatus.pendingChanges > 0 && syncStatus.isOnline) {
          logger.info('Dashboard: Syncing pending changes');
          await dataManager.performSync();
          const syncStatusAfter = await dataManager.getSyncStatus();
          logger.info('Dashboard: Pending changes after sync', {
            pendingChanges: syncStatusAfter.pendingChanges,
          });
        } else {
          logger.info('Dashboard: No pending changes to sync or offline');
        }
      } catch (err) {
        logger.error('Dashboard: Error syncing pending changes', err);
      }
    };
    syncPendingChanges();
  }, []);

  const handleNuclearReset = () => {
    Alert.alert(
      t('⚠️ Emergency Database Reset'),
      t(
        "This will completely clear all local data and recreate databases. Only use if you're experiencing severe storage issues.\n\nThis action cannot be undone. Continue?"
      ),
      [
        {
          text: t('Cancel'),
          style: 'cancel',
        },
        {
          text: t('Reset Databases'),
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              logger.userAction('nuclear_reset_initiated', 'Dashboard');
              const success = await performNuclearReset();

              if (success) {
                logger.info('Dashboard: Nuclear reset successful');
                Alert.alert(
                  t('✅ Reset Successful'),
                  t('Databases have been reset successfully. The app should now work normally.')
                );
              } else {
                logger.error(
                  'Dashboard: Nuclear reset failed',
                  new Error('Reset operation failed')
                );
                Alert.alert(
                  t('❌ Reset Failed'),
                  t('Database reset failed. Please restart the app and try again.')
                );
              }
            } catch (error) {
              logger.error('Dashboard: Nuclear reset error', error);
              Alert.alert(
                t('Reset Error'),
                t('An error occurred during reset. Please restart the app.')
              );
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={{ backgroundColor: 'white' }}>
      <ImageBackground
        style={{
          width: screenWidth,
          height: 120.4,
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          backgroundColor: 'white',
        }}
        source={group8043}
      >
        <View>
          <Image style={{ height: 70, width: 180 }} resizeMode="contain" source={group2} />
        </View>
      </ImageBackground>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          marginVertical: 20,
          borderRadius: 15,
        }}
      >
        <SmallCard
          image={BG1}
          onCardPress={() => Alert.alert(t('upcoming_feature'))}
          title={t('PAI')}
          icon={<Chart />}
        />
        <SmallCard
          image={BG2}
          onCardPress={() => Alert.alert(t('upcoming_feature'))}
          title={t('learn_and_news')}
          icon={<FileIcon />}
        />
      </View>
      <BigCard
        image={BG9}
        onCardPress={() => navigation.navigate('CitizenEngagement')}
        title={t('citizen_engagement')}
        icon={<TeamWorkIcon />}
      />
      <View style={{ marginVertical: 20 }}>
        <BigCard
          image={smallRectangle}
          onCardPress={() => navigation.navigate('SyncAttachments')}
          title={t('sync_files')}
          icon={<SyncIcon />}
          cardHeight={79}
        />
      </View>

      {/* Emergency Nuclear Reset Button - Only show in development or when needed */}
      {__DEV__ && (
        <View style={{ marginVertical: 20, paddingHorizontal: 20 }}>
          <Button
            mode="outlined"
            icon="nuclear"
            onPress={handleNuclearReset}
            loading={isResetting}
            disabled={isResetting}
            style={{
              borderColor: '#ff4444',
              backgroundColor: 'rgba(255, 68, 68, 0.1)',
            }}
            labelStyle={{ color: '#ff4444' }}
          >
            {isResetting ? t('Resetting...') : t('💥 Emergency Database Reset')}
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

export default Content;
