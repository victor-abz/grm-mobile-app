import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useData } from '../../../../providers/DataProvider';
import { performNuclearReset } from '../../../../services/NuclearDataManager';
import BigCard from '../components/BigCard';
import SmallCard from '../components/SmallCard';
import Chart from '../../../../../assets/chart_line_solid.svg';
import FileIcon from '../../../../../assets/file_alt_regular.svg';
import SyncIcon from '../../../../../assets/sync_alt_solid.svg';
import TeamWorkIcon from '../../../../../assets/team-work.svg';
import lookupDataManager from '../../../../services/LookupDataManager';
import dataManager from '../../../../services/DataManager';

const screenWidth = Dimensions.get('window').width;

function Content() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { performNuclearReset, refreshLookupData } = useData();
  const [isResetting, setIsResetting] = useState(false);

  // Trigger background sync when home page loads
  useEffect(() => {
    const triggerBackgroundSync = async () => {
      try {
        console.log('🏠 Home page loaded, triggering background sync...');
        await lookupDataManager.performBackgroundSync();
        console.log('✅ Background sync completed on home page');
      } catch (error) {
        console.warn('⚠️ Background sync failed on home page:', error.message);
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
        console.log('[Home] Pending changes on load:', syncStatus.pendingChanges);
        if (syncStatus.pendingChanges > 0 && syncStatus.isOnline) {
          console.log('[Home] Syncing pending changes...');
          await dataManager.performSync();
          const syncStatusAfter = await dataManager.getSyncStatus();
          console.log('[Home] Pending changes after sync:', syncStatusAfter.pendingChanges);
        } else {
          console.log('[Home] No pending changes to sync or offline.');
        }
      } catch (err) {
        console.log('[Home] Error syncing pending changes:', err.message);
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
              console.log('💥 User initiated nuclear reset from Dashboard');
              const success = await performNuclearReset();

              if (success) {
                Alert.alert(
                  t('✅ Reset Successful'),
                  t('Databases have been reset successfully. The app should now work normally.')
                );
              } else {
                Alert.alert(
                  t('❌ Reset Failed'),
                  t('Database reset failed. Please restart the app and try again.')
                );
              }
            } catch (error) {
              console.error('Nuclear reset error:', error);
              Alert.alert(
                t('❌ Reset Error'),
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
        source={require('../../../../../assets/drawable-xhdpi/group_8043.png')}
      >
        <View>
          <Image
            style={{ height: 70, width: 180 }}
            resizeMode={'contain'}
            source={require('../../../../../assets/drawable-xhdpi/group_2.png')}
          />
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
          image={require('../../../../../assets/BG_1.png')}
          onCardPress={() => alert(t('Upcoming feature'))}
          title={t('PAI')}
          icon={<Chart />}
        />
        <SmallCard
          image={require('../../../../../assets/BG_2.png')}
          onCardPress={() => alert(t('Upcoming feature'))}
          title={t('Apprendre \n' + 'et actualités')}
          icon={<FileIcon />}
        />
      </View>
      <BigCard
        image={require('../../../../../assets/BG_9.png')}
        onCardPress={() => navigation.navigate('CitizenEngagement')}
        title={t("Mécanisme d'engagement des citoyens")}
        icon={<TeamWorkIcon />}
      />
      <View style={{ marginVertical: 20 }}>
        <BigCard
          image={require('../../../../../assets/small-rectangle.png')}
          onCardPress={() => navigation.navigate('SyncAttachments')}
          title={t('Sync Files')}
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

      {/*<ReactNativeSwipeableViewStack*/}
      {/*  // onSwipe={(swipedIndex) => this.onCardSwipe(swipedIndex)}*/}
      {/*  initialSelectedIndex={1}*/}
      {/*  stackSpacing={Platform.OS === "ios" ? 30 : 20}*/}
      {/*  onItemClicked={() => console.log("click")}*/}
      {/*  pointerEvents="none"*/}
      {/*  renderItem={(element) => (*/}
      {/*    <Card*/}
      {/*      pointerEvents="none"*/}
      {/*      style={{*/}
      {/*        width: screenWidth * 0.888,*/}
      {/*        alignSelf: "center",*/}
      {/*        borderRadius: 15,*/}
      {/*        backgroundColor: "white",*/}
      {/*        padding: 19,*/}
      {/*      }}*/}
      {/*    >*/}
      {/*      <Headline*/}
      {/*        style={{*/}
      {/*          color: "#707070",*/}
      {/*          fontWeight: "500",*/}
      {/*        }}*/}
      {/*      >*/}
      {/*        Prochaine tâche*/}
      {/*      </Headline>*/}
      {/*      <Paragraph*/}
      {/*        style={{*/}
      {/*          color: "#707070",*/}
      {/*        }}*/}
      {/*      >*/}
      {/*        Lorem Ipsum is simply dummy text of the printing and typesetting*/}
      {/*        industry. Lorem Ipsum has been the industry's standard dummy text*/}
      {/*        ever since the 1500s.*/}
      {/*      </Paragraph>*/}
      {/*      <Button*/}
      {/*        onPress={() => alert("hey")}*/}
      {/*        style={{*/}
      {/*          alignSelf: "flex-end",*/}
      {/*          backgroundColor: "#24c38b",*/}
      {/*          width: 115,*/}
      {/*          marginTop: 20,*/}
      {/*          borderRadius: 7,*/}
      {/*          padding: 5,*/}
      {/*        }}*/}
      {/*        labelStyle={{*/}
      {/*          color: "white",*/}
      {/*        }} */}
      {/*      >*/}
      {/*        Tâches*/}
      {/*      </Button>*/}
      {/*    </Card>*/}
      {/*  )}*/}
      {/*/>*/}
    </ScrollView>
  );
}

export default Content;
