import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../utils/colors';
import BarChartGrm from '../components/BarChartGrm';
import PieChartGrm from '../components/PieChartGrm';

function Content({
  issues,
  eadl,
  statuses,
  ageGroup,
  citizenGroup1,
  citizenGroup2,
  issueType,
  issueCategory,
  issueComponent,
  issueSubComponent,
}) {
  const { t } = useTranslation();

  const [_issues, setIssues] = useState([]);

  const [dataAgeGroup, setDataAgeGroup] = useState([]);
  const [dataCitizenGroup1, setDataCitizenGroup1] = useState([]);
  const [dataCitizenGroup2, setDataCitizenGroup2] = useState([]);
  const [dataIssueType, setDataIssueType] = useState([]);
  const [dataIssueCategory, setDataIssueCategory] = useState([]);
  const [dataIssueComponent, setDataIssueComponent] = useState([]);
  const [dataIssueSubComponent, setDataIssueSubComponent] = useState([]);
  const [dataIssuePerDate, setDataIssuePerDate] = useState({ labels: [], dataSet: [] });

  const randomHexColorCode = () => {
    const n = (Math.random() * 0xfffff * 1000000).toString(16);
    return `#${n.slice(0, 6)}`;
  };

  // ISSUES PROCESSED BY YOU
  useEffect(() => {
    setIssues(issues);

    const labels = [];
    issues.forEach((value) => {
      const date = moment(value.created_date).format('DD-MMM-YYYY');
      const i = labels.indexOf(date);
      if (i === -1) {
        labels.push(date);
      }
    });
    labels.sort((objA, objB) => moment(objA, 'DD-MMM-YYYY') - moment(objB, 'DD-MMM-YYYY'));

    const dataSet = [];
    labels.forEach(() => dataSet.push(0));

    // Age group data initialization
    const _dataAgeGroup = [];
    ageGroup.forEach((value) => {
      _dataAgeGroup.push({
        code: value?.id,
        name: value.name,
        population: 0,
        color: randomHexColorCode(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      });
    });
    setDataAgeGroup(_dataAgeGroup);

    // Occupation status data initialization
    const _dataCitizenGroup1 = [];
    citizenGroup1.forEach((value) => {
      _dataCitizenGroup1.push({
        code: value?.id,
        name: value.name,
        population: 0,
        color: randomHexColorCode(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      });
    });
    setDataCitizenGroup1(_dataCitizenGroup1);

    // Education level data initialization
    const _dataCitizenGroup2 = [];
    citizenGroup2.forEach((value) => {
      _dataCitizenGroup2.push({
        code: value?.id,
        name: value.name,
        population: 0,
        color: randomHexColorCode(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      });
    });
    setDataCitizenGroup2(_dataCitizenGroup2);

    // Issue type data initialization
    const _dataIssueType = [];
    issueType.forEach((value) => {
      _dataIssueType.push({
        code: value?.id,
        name: value.name,
        population: 0,
        color: randomHexColorCode(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      });
    });
    setDataIssueType(_dataIssueType);

    // Issue category data initialization
    const _dataIssueCategory = [];
    issueCategory?.forEach((value) => {
      _dataIssueCategory.push({
        code: value?.id,
        name: value.name,
        population: 0,
        color: randomHexColorCode(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      });
    });
    setDataIssueCategory(_dataIssueCategory);

    // Issue Component data initialization
    const _dataIssueComponent = [];
    issueComponent.forEach((value) => {
      _dataIssueComponent.push({
        code: value?.id,
        name: value.name,
        population: 0,
        color: randomHexColorCode(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      });
    });
    setDataIssueComponent(_dataIssueComponent);

    // Issue sub component data initialization
    const _dataIssueSubComponent = [];
    issueSubComponent.forEach((value) => {
      _dataIssueSubComponent.push({
        code: value?.id,
        name: value.name,
        population: 0,
        color: randomHexColorCode(),
        legendFontColor: '#7F7F7F',
        legendFontSize: 15,
      });
    });
    setDataIssueSubComponent(_dataIssueSubComponent);

    issues.forEach((item) => {
      // Age group data filling
      let index = _dataAgeGroup.findIndex((value) => value.code === item?.citizen_age_group?.id);
      if (index !== -1) {
        _dataAgeGroup[index].population += 1;
        setDataAgeGroup(_dataAgeGroup);
      }

      // Occupation status data filling
      index = _dataCitizenGroup1.findIndex((value) => value.code === item?.citizen_group_1);
      if (index !== -1) {
        _dataCitizenGroup1[index].population += 1;
        setDataCitizenGroup1(_dataCitizenGroup1);
      }

      // Education level data filling
      index = _dataCitizenGroup2.findIndex((value) => value.code === item?.citizen_group_2);
      if (index !== -1) {
        _dataCitizenGroup2[index].population += 1;
        setDataCitizenGroup2(_dataCitizenGroup2);
      }

      // Issue type data filling
      index = _dataIssueType.findIndex((value) => value.code === item?.issue_type?.id);
      if (index !== -1) {
        _dataIssueType[index].population += 1;
        setDataIssueType(_dataIssueType);
      }

      // Issue category data filling
      index = _dataIssueCategory.findIndex((value) => value.code === item?.category?.id);
      if (index !== -1) {
        _dataIssueCategory[index].population += 1;
        setDataIssueCategory(_dataIssueCategory);
      }

      // Issue component data filling
      index = _dataIssueComponent.findIndex((value) => value.code === item?.component?.id);
      if (index !== -1) {
        _dataIssueComponent[index].population += 1;
        setDataIssueComponent(_dataIssueComponent);
      }

      // Issue sub component data filling
      index = _dataIssueSubComponent.findIndex((value) => value.code === item?.sub_component?.id);
      if (index !== -1) {
        _dataIssueSubComponent[index].population += 1;
        setDataIssueSubComponent(_dataIssueSubComponent);
      }

      const date = moment(item.created_date).format('DD-MMM-YYYY');
      const i = labels.indexOf(date);
      if (i !== -1) {
        dataSet[i] += 1;
      }
    });
    const issuePerDate = dataIssuePerDate;
    issuePerDate.labels = labels;
    issuePerDate.dataSet = dataSet;
    setDataIssuePerDate(issuePerDate);
  }, []);

  return (
    <View>
      <View style={styles.summaryContainer}>
        {dataIssuePerDate.labels.length > 0 && (
          <View>
            <View style={styles.container}>
              <Text style={styles.statisticsText}>{t('stat_nb_issue_by_per_date')}</Text>
            </View>
            <BarChartGrm
              labelNames={dataIssuePerDate.labels}
              dataValue={dataIssuePerDate.dataSet}
            />
          </View>
        )}
        <View>
          <View style={styles.container}>
            <Text style={styles.statisticsText}>{t('stat_nb_issue_by_age_range')}</Text>
          </View>
          <PieChartGrm data={dataAgeGroup} />
        </View>

        {dataCitizenGroup1.length > 0 && (
          <View>
            <View style={styles.container}>
              <Text style={styles.statisticsText}>{t('stat_nb_issue_by_occupation_status')}</Text>
            </View>
            <PieChartGrm data={dataCitizenGroup1} />
          </View>
        )}

        {dataCitizenGroup2.length > 0 && (
          <View>
            <View style={styles.container}>
              <Text style={styles.statisticsText}>{t('stat_nb_issue_by_education_level')}</Text>
            </View>
            <PieChartGrm data={dataCitizenGroup2} />
          </View>
        )}

        <View>
          <View style={styles.container}>
            <Text style={styles.statisticsText}>{t('stat_nb_issue_by_issue_type')}</Text>
          </View>
          <PieChartGrm data={dataIssueType} />
        </View>

        <View>
          <View style={styles.container}>
            <Text style={styles.statisticsText}>{t('stat_nb_issue_by_issue_category')}</Text>
          </View>
          <PieChartGrm data={dataIssueCategory} />
        </View>

        <View>
          <View style={styles.container}>
            <Text style={styles.statisticsText}>{t('stat_nb_issue_by_issue_component')}</Text>
          </View>
          <PieChartGrm data={dataIssueComponent} />
        </View>

        <View>
          <View style={styles.container}>
            <Text style={styles.statisticsText}>{t('stat_nb_issue_by_issue_sub_component')}</Text>
          </View>
          <PieChartGrm data={dataIssueSubComponent} />
        </View>
      </View>
    </View>
  );
}

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
  statisticsText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    fontWeight: 'bold',
    fontStyle: 'normal',
    letterSpacing: 0,
    textAlign: 'left',
    color: colors.primary,
    lineHeight: 18,
    // width: '80%',
  },
  statisticsValueDanger: {
    color: '#ef6a78',
    width: '20%',
    textAlign: 'center',
  },
  statisticsValuePrimary: {
    color: colors.primary,
    width: '20%',
    textAlign: 'center',
  },
});

export default Content;
