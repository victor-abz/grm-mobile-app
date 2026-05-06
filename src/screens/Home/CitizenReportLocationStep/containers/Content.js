import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
  TextInput as NativeTextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, TextInput } from 'react-native-paper';
import { i18n } from "../../../../translations/i18n";
import { styles } from './Content.styles';
import { colors } from '../../../../utils/colors';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

export function Content({ stepOneParams, stepTwoParams, issueCommunes, uniqueRegion }) { 
  const navigation = useNavigation();
  const [communes, setCommunes] = useState(issueCommunes);
  const [region, setRegion] = useState(null);
  const [location, setLocation] = useState();
  const [pickersState, setPickersState] = useState([]);
  const [additionalDetails, setAdditionalDetails] = useState(null);
  const [initialized, setInitialized] = useState(false);
  // const [communesSubPickers, setCommunesSubPickers] = useState([]);

  useEffect(() => {
    if (issueCommunes && !initialized) {
      setInitialized(true);
      setCommunes(issueCommunes);
    }
  }, [issueCommunes]);

  // const handler = (selectedAdministrativeId, _index) => {
  //   let communesCopy = communes.slice();
  //   let updatedPickers = [];
  //   let index;
  //   if (_index !== undefined) index = _index + 1;

  //   // Filter communes by parent_id (administrative ID)
  //   communesCopy = communesCopy.filter((x) => String(x.parent_id) === String(selectedAdministrativeId));

  //   if (communesCopy.length > 0) {
  //     if (communesSubPickers[index]) {
  //       // If picker exist at position -> Replace picker content
  //       updatedPickers = [...communesSubPickers];
  //       updatedPickers[index] = selectedAdministrativeId;
  //     } else {
  //       // Otherwise -> Add new picker
  //       updatedPickers = [...communesSubPickers, selectedAdministrativeId];
  //     }
  //     setCommunesSubPickers(updatedPickers);
  //   } else {
  //     // Remove next pickers/selected values and stop
  //     updatedPickers = [...communesSubPickers];
  //     if (index === undefined) {
  //       updatedPickers = [];
  //       setPickersState([]);
  //     } else {
  //       updatedPickers.splice(index, communesSubPickers.length - index);
  //     }
  //     setCommunesSubPickers(updatedPickers);
  //   }
  // };

  // const handlePickCommune = useCallback(debounce(handler, 100), [
  //   communesSubPickers,
  //   communes,
  //   pickersState,
  // ]);

  // const filterCommunes = (parent_region) => {
  //   let _communes = communes.slice();
  //   _communes = parent_region ? _communes.filter((commune) => String(commune.parent_id) === String(parent_region)) : _communes;
  //   _communes = _communes.map(({ parent_id, ...rest }) => ({
  //     ...rest,
  //     parentRegion: parent_region,
  //   }));
  //   return _communes;
  // };

  const formattedTopLevelCommunes = useMemo(() => {
    if (!communes?.length) return [];
    // return filterCommunes(null);
    return communes;
  }, [communes]);
  
  return (
    <View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{i18n.t('step_4')}</Text>
          <Text style={styles.stepDescription}>{i18n.t('step_location_description')}</Text>
          <Text style={styles.stepNote}>{i18n.t('step_location_body')}</Text>
        </View>
        {!uniqueRegion && communes && (
          <View key="firstLevel">
            <CustomDropDownPicker
              schema={{
                label: 'hierarchical_name',
                value: 'id',
              }}
              searchable={true}
              listMode="FLATLIST"
              flatListProps={{
                // extra tuning for large lists
                initialNumToRender: 20,
                maxToRenderPerBatch: 28,
                windowSize: 10,
              }}
              placeholder={i18n.t('step_location_dropdown_placeholder')}
              value={region}
              disabled={!!uniqueRegion}
              items={formattedTopLevelCommunes}
              setPickerValue={(val) => {
                setRegion(val());
                // if (val() && val() !== commune1) handlePickCommune(val());
              }}
              onSelectItem={(item) => setLocation(item)}
            />
          </View>
        )}

        {/* Rendered after picking one from above */}
        {/* {communesSubPickers.map((parent_region, index) => (
          <View style={{ zIndex: 1000 + index }} key={{ index }}>
            <CustomDropDownPicker
              schema={{
                label: 'name',
                value: 'id',
              }}
              // disabled={!!uniqueRegion}
              placeholder={i18n.t('step_location_dropdown_placeholder')}
              value={pickersState[index]}
              items={filterCommunes(parent_region, index)}
              onSelectItem={(item) => setLocation(item)}
              setPickerValue={(val) => {
                const newState = [...pickersState];
                newState.splice(index, newState.length - index);
                newState[index] = val();
                setPickersState(newState);
                if (val) {
                  handlePickCommune(val(), index);
                }
              }}
            />
          </View>
        ))} */}
        <View style={{ paddingHorizontal: 50 }}>
          <Text style={styles.stepNote}>{i18n.t('step_location_input_explanation')}</Text>
          <TextInput
            multiline
            numberOfLines={4}
            style={[
              styles.grmInput,
              {
                height: 100,
                justifyContent: 'flex-start',
                textAlignVertical: 'top',
                fontSize: 14,
              },
            ]}
            placeholder={i18n.t('step_2_placeholder_3')}
            outlineColor="#dedede"
            theme={theme}
            mode="outlined"
            value={additionalDetails}
            onChangeText={(text) => setAdditionalDetails(text)}
            render={(innerProps) => (
              <NativeTextInput
                {...innerProps}
                style={[
                  innerProps.style,
                  {
                    paddingTop: 8,
                    paddingBottom: 8,
                    height: 100,
                  },
                ]}
              />
            )}
          />
        </View>

        <View style={{ paddingHorizontal: 50 }}>
          <Button
            theme={theme}
            disabled={
              (region === null || [region, ...pickersState].length === 0) && !uniqueRegion
            }
            style={{ alignSelf: 'center', margin: 24 }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={() =>
            {
              navigation.navigate('CitizenReportStep3', {
                stepOneParams,
                stepTwoParams,
                stepLocationParams: {
                  issueLocation: {
                    id: uniqueRegion?.id ?? location?.id,
                    name: uniqueRegion?.name ?? location?.name,
                    administrative_id: uniqueRegion?.id ?? location?.id,
                    created_date: uniqueRegion?.created_date ?? location?.created_date,
                    updated_date: uniqueRegion?.updated_date ?? location?.updated_date,
                  },
                  locationDescription: additionalDetails,
                },
              });
            }}
          >
            {i18n.t('next')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default Content;
