import UserAvatar from '@muhzi/react-native-user-avatar';
import { useNavigation } from '@react-navigation/native';
import i18n from 'i18n-js';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { logout } from '../../../../store/ducks/authentication.duck';
import { colors } from '../../../../utils/colors';
import { ResourceUrl } from '../../../../utils/databaseManager';
import ProfileItem from '../components/ProfileItem';
import SmallCard from '../components/SmallCard';
import styles from './Content.style';

function Content({ issues, eadl, department, statuses }) {
  const [photo, setPhoto] = useState(null);
  const [_issues, setIssues] = useState([]);
  const [nbOpened, setNbOpened] = useState(0);
  const [nbAssigned, setNbAssigned] = useState(0);
  const [nbProcessedByYou, setNbProcessedByYou] = useState(0);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  useEffect(() => {
    if (eadl) {
      if (eadl.representative.photo && eadl.representative.photo.includes('https://')) {
        setPhoto(eadl.representative.photo);
      } else {
        setPhoto(`${ResourceUrl}${eadl.representative?.photo}`);
      }
    }
  }, [eadl]);

  useEffect(() => {
    if (!issues) return;
    setIssues(issues);

    // ISSUES CREATED BY THE CURRENT USER
    setNbOpened(issues.filter((issue) => issue.reporter && issue.reporter.id === eadl?._id).length);

    // ISSUES ASSIGNED TO THE CURRENT USER
    setNbAssigned(
      issues.filter((issue) => issue.assignee && issue.assignee.id === eadl?._id).length
    );

    // ISSUES PROCESSED BY THE CURRENT USER
    const foundStatus = statuses.find((el) => el.final_status === true);
    const filteredIssues = issues.filter(
      (issue) =>
        issue.assignee && issue.assignee.id === eadl?._id && issue.status.id === foundStatus?.id
    );
    setNbProcessedByYou(filteredIssues.length);
  }, [issues]);

  return (
    <View>
      <View style={styles.containerA}>
        <UserAvatar size={120} src={photo} />
      </View>
      <Text style={styles.listHeader}>{i18n.t('your_complaint_count')}</Text>
      <View style={styles.cardContainer}>
        <SmallCard
          image={require('../../../../../assets/BG_2.png')}
          title={i18n.t('reported')}
          count={nbOpened}
        />
        <SmallCard
          image={require('../../../../../assets/BG_9.png')}
          title={i18n.t('assigned')}
          count={nbAssigned}
        />
        <SmallCard
          image={require('../../../../../assets/BG_1.png')}
          title={i18n.t('resolved')}
          count={nbProcessedByYou}
        />
      </View>
      <Text style={styles.listHeader}>{i18n.t('your_personal_info')}</Text>
      <ProfileItem title={i18n.t('full_name')} description={eadl?.representative?.name} />
      <ProfileItem title={i18n.t('email')} description={eadl?.representative?.email} />
      <ProfileItem title={i18n.t('phone')} description={eadl?.representative?.phone} />
      <ProfileItem title={i18n.t('location')} description={eadl?.name} />
      <ProfileItem title={i18n.t('department')} description={department?.name} />
      <ProfileItem
        title={i18n.t('is_village_secretary')}
        description={eadl?.village_secretary === 1 ? 'Oui' : 'Non'}
      />
      <View style={styles.containerA}>
        <Button color={colors.primary} onPress={() => dispatch(logout())}>
          {i18n.t('logout')}
        </Button>
      </View>
    </View>
  );
}

export default Content;
