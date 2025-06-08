import { useNavigation } from '@react-navigation/native';
import { debounce } from 'lodash';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput as NativeTextInput,
  View,
  Dimensions,
} from 'react-native';
import { ActivityIndicator, Button, Card, Chip, IconButton, TextInput } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import CustomDropDownPicker from '../../../../components/CustomDropDownPicker/CustomDropDownPicker';
import { DataContext } from '../../../../providers/DataProvider';
import { colors } from '../../../../utils/colors';
import { styles } from './Content.styles';

const theme = {
  roundness: 12,
  colors: {
    ...colors,
    background: 'white',
    placeholder: '#dedede',
    text: '#707070',
  },
};

const { width, height } = Dimensions.get('window');

export function Content({ stepOneParams, stepTwoParams }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const {
    userRegionService,
    regionError,
    isLoading: dataLoading,
    getUserRegions,
    getTopLevelRegions,
    getRegionChildren,
    refreshRegionData,
  } = useContext(DataContext);

  // State for region selection
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionHierarchy, setRegionHierarchy] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);

  // State for location details
  const [locationDescription, setLocationDescription] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);
  const [nearestRegion, setNearestRegion] = useState(null);

  // State for UI
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Initialize component
  useEffect(() => {
    initializeLocationStep();
  }, []);

  const initializeLocationStep = async () => {
    try {
      console.log('🏗️ Initializing CitizenReportLocationStep...');

      if (regionError) {
        console.error('❌ Region error detected:', regionError);
        return;
      }

      // Get user's accessible regions
      const regions = getUserRegions();

      if (!regions || regions.length === 0) {
        setLocationError({
          type: 'NO_REGIONS',
          message: 'No administrative regions available. Please contact administrator.',
        });
        return;
      }

      // Get top-level regions (regions without parent)
      const topLevelRegions = getTopLevelRegions();

      console.log(`📍 Loaded ${regions.length} total regions, ${topLevelRegions.length} top-level`);

      // If no top-level regions, use all regions as available
      const availableForSelection = topLevelRegions.length > 0 ? topLevelRegions : regions;
      setAvailableRegions(availableForSelection);
      setIsInitialized(true);

      // Try to get cached location
      const cachedLocationResult = await userRegionService.getCachedLocation();
      if (cachedLocationResult.success) {
        setCurrentLocation(cachedLocationResult.location);
        setSelectedMapLocation(cachedLocationResult.location);
        findAndSetNearestRegion(cachedLocationResult.location);
      }
    } catch (error) {
      console.error('❌ Error initializing location step:', error);
      setLocationError({
        type: 'INITIALIZATION_ERROR',
        message: error.message,
      });
    }
  };

  const requestLocationPermission = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      console.log('🔍 Requesting location permission...');

      const permissionResult = await userRegionService.requestLocationPermission();

      if (!permissionResult.success) {
        setLocationError({
          type: 'PERMISSION_DENIED',
          message: permissionResult.message,
        });
        return;
      }

      // Get current location
      const locationResult = await userRegionService.getCurrentLocation();

      if (locationResult.success) {
        setCurrentLocation(locationResult.location);
        setSelectedMapLocation(locationResult.location);
        findAndSetNearestRegion(locationResult.location);

        Alert.alert(
          '📍 Location Detected',
          `Current location obtained successfully. ${
            nearestRegion
              ? `Nearest region: ${nearestRegion.region.name}`
              : 'No nearby regions found.'
          }`,
          [{ text: 'OK' }]
        );
      } else {
        setLocationError({
          type: 'LOCATION_ERROR',
          message: locationResult.message,
        });
      }
    } catch (error) {
      console.error('❌ Error getting location:', error);
      setLocationError({
        type: 'LOCATION_ERROR',
        message: error.message,
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const findAndSetNearestRegion = (location) => {
    const nearest = userRegionService.findNearestRegion(location);
    setNearestRegion(nearest);

    if (nearest) {
      console.log(
        `📍 Nearest region: ${nearest.region.name} (${nearest.distance.toFixed(2)}km away)`
      );
    }
  };

  const handleMapLocationSelect = (coordinate) => {
    const location = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      accuracy: 10, // Estimated accuracy for map selection
      timestamp: new Date().toISOString(),
    };

    setSelectedMapLocation(location);
    findAndSetNearestRegion(location);

    console.log('🗺️ Location selected on map:', location);
  };

  const handleRegionSelection = useCallback(
    debounce((selectedRegionId, level = 0) => {
      console.log(`🎯 Region selected at level ${level}:`, selectedRegionId);

      // Find the selected region
      const region = getUserRegions().find((r) => r.administrative_id === selectedRegionId);

      if (!region) {
        console.error('❌ Selected region not found:', selectedRegionId);
        return;
      }

      // Update hierarchy up to current level
      const newHierarchy = regionHierarchy.slice(0, level);
      newHierarchy[level] = selectedRegionId;
      setRegionHierarchy(newHierarchy);

      // Set the selected region
      setSelectedRegion(region);

      // Get children for next level
      const children = getRegionChildren(selectedRegionId);

      if (children.length > 0) {
        console.log(`📂 Found ${children.length} child regions for ${region.name}`);
        // We'll handle showing children in the render method
      } else {
        console.log(`📍 Final region selected: ${region.name}`);
      }
    }, 300),
    [regionHierarchy, getUserRegions, getRegionChildren]
  );

  const handleNearestRegionSelect = () => {
    if (nearestRegion) {
      const region = nearestRegion.region;
      setSelectedRegion(region);

      // Build hierarchy path to this region
      const hierarchy = [];
      let currentRegion = region;

      // Build path from bottom to top
      const path = [currentRegion];
      while (currentRegion.parent_id) {
        const parent = getUserRegions().find(
          (r) => r.administrative_id === currentRegion.parent_id
        );
        if (parent) {
          path.unshift(parent);
          currentRegion = parent;
        } else {
          break;
        }
      }

      // Set hierarchy
      setRegionHierarchy(path.map((r) => r.administrative_id));
    }
  };

  const getRegionsForLevel = (level) => {
    if (level === 0) {
      return availableRegions; // Use availableRegions instead of getTopLevelRegions()
    }

    const parentId = regionHierarchy[level - 1];
    return parentId ? getRegionChildren(parentId) : [];
  };

  const getCurrentLevelRegions = () => {
    const currentLevel = regionHierarchy.length;
    return getRegionsForLevel(currentLevel);
  };

  const handleNext = () => {
    if (!selectedRegion) {
      Alert.alert(t('error'), 'Please select a location before proceeding.', [{ text: 'OK' }]);
      return;
    }

    const locationParams = {
      issueLocation: {
        administrative_id: selectedRegion.administrative_id,
        name: selectedRegion.name,
        administrative_level: selectedRegion.administrative_level,
      },
      locationDescription,
    };

    // Include geolocation if available (prefer map selection over GPS)
    const locationToUse = selectedMapLocation || currentLocation;
    if (locationToUse) {
      locationParams.coordinates = {
        latitude: locationToUse.latitude,
        longitude: locationToUse.longitude,
        accuracy: locationToUse.accuracy,
        timestamp: locationToUse.timestamp,
        source: selectedMapLocation ? 'map_selection' : 'gps_detection',
      };
    }

    console.log('➡️ Proceeding to step 3 with location params:', locationParams);

    navigation.navigate('CitizenReportStep3', {
      stepOneParams,
      stepTwoParams,
      stepLocationParams: locationParams,
    });
  };

  const renderRegionError = () => {
    if (!regionError) return null;

    return (
      <Card style={{ margin: 16, backgroundColor: '#ffebee' }}>
        <Card.Content>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#c62828', marginBottom: 8 }}>
            {regionError.title || 'Region Access Error'}
          </Text>
          <Text style={{ color: '#d32f2f', marginBottom: 8 }}>{regionError.message}</Text>
          <Text style={{ color: '#666', fontSize: 14 }}>{regionError.action}</Text>
          <Button
            mode="outlined"
            onPress={refreshRegionData}
            style={{ marginTop: 16 }}
            disabled={dataLoading}
          >
            {dataLoading ? 'Refreshing...' : 'Try Again'}
          </Button>
        </Card.Content>
      </Card>
    );
  };

  const renderLocationDetection = () => (
    <Card style={{ margin: 16, backgroundColor: '#f5f5f5' }}>
      <Card.Content>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', flex: 1 }}>
            📍 Location Detection & Selection
          </Text>
          <IconButton
            icon={showMap ? 'chevron-up' : 'chevron-down'}
            onPress={() => setShowMap(!showMap)}
          />
        </View>

        {/* GPS Location Detection */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#333' }}>GPS Location:</Text>
            <Button
              mode="outlined"
              onPress={requestLocationPermission}
              loading={isLoadingLocation}
              disabled={isLoadingLocation}
              style={{ borderColor: '#24c38b' }}
              labelStyle={{ color: '#24c38b', fontSize: 12 }}
            >
              {currentLocation ? 'Refresh GPS' : 'Get GPS Location'}
            </Button>
          </View>

          {currentLocation && (
            <View style={{ marginTop: 8, padding: 12, backgroundColor: '#e8f5e8', borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#2e7d32' }}>
                📍 GPS: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </Text>
              <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                Accuracy: ±{currentLocation.accuracy?.toFixed(0) || '?'}m
              </Text>
            </View>
          )}
        </View>

        {/* Map Location Selection */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#333' }}>Map Selection:</Text>
            <Button
              mode="outlined"
              onPress={() => setShowMap(!showMap)}
              style={{ borderColor: '#2196f3' }}
              labelStyle={{ color: '#2196f3', fontSize: 12 }}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </Button>
          </View>

          {selectedMapLocation && (
            <View style={{ marginTop: 8, padding: 12, backgroundColor: '#e3f2fd', borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#1976d2' }}>
                🗺️ Map: {selectedMapLocation.latitude.toFixed(6)}, {selectedMapLocation.longitude.toFixed(6)}
              </Text>
              <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                Source: {selectedMapLocation === currentLocation ? 'GPS auto-set' : 'Manual selection'}
              </Text>
            </View>
          )}
        </View>

        {/* Interactive Map */}
        {showMap && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              Tap on the map to select a precise location:
            </Text>
            <View style={{ height: 250, borderRadius: 12, overflow: 'hidden' }}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: selectedMapLocation?.latitude || currentLocation?.latitude || -1.9441,
                  longitude: selectedMapLocation?.longitude || currentLocation?.longitude || 30.0619,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={(event) => handleMapLocationSelect(event.nativeEvent.coordinate)}
                showsUserLocation={true}
                showsMyLocationButton={true}
                toolbarEnabled={false}
              >
                {selectedMapLocation && (
                  <Marker
                    coordinate={{
                      latitude: selectedMapLocation.latitude,
                      longitude: selectedMapLocation.longitude,
                    }}
                    title="Selected Location"
                    description="Tap and drag to adjust"
                    draggable={true}
                    onDragEnd={(event) => handleMapLocationSelect(event.nativeEvent.coordinate)}
                  />
                )}
                
                {/* Show user's current GPS location if different from selected */}
                {currentLocation && 
                 selectedMapLocation !== currentLocation && (
                  <Marker
                    coordinate={{
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                    }}
                    title="Your GPS Location"
                    description="Current device location"
                    pinColor="blue"
                  />
                )}
              </MapView>
            </View>
          </View>
        )}

        {/* Nearest Region Information */}
        {nearestRegion && (selectedMapLocation || currentLocation) && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8 }}>
              🎯 Nearest Administrative Region:
            </Text>
            <View style={{ padding: 12, backgroundColor: '#fff3e0', borderRadius: 8 }}>
              <Text style={{ fontSize: 13, color: '#f57c00', fontWeight: '500' }}>
                {nearestRegion.region.name}
              </Text>
              <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                Distance: {nearestRegion.distance.toFixed(2)}km | Level:{' '}
                {nearestRegion.region.administrative_level}
              </Text>
              <View style={{ marginTop: 8 }}>
                <Button
                  mode="outlined"
                  onPress={handleNearestRegionSelect}
                  style={{ borderColor: '#ff9800' }}
                  labelStyle={{ color: '#ff9800', fontSize: 12 }}
                  compact
                >
                  Select This Region
                </Button>
              </View>
            </View>
          </View>
        )}

        {locationError && (
          <Text style={{ color: '#d32f2f', fontSize: 14 }}>⚠️ {locationError.message}</Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderRegionSelector = () => {
    // Updated condition: check if initialized AND has any regions (not just top-level)
    if (!isInitialized || getUserRegions().length === 0) {
      return (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#24c38b" />
          <Text style={{ marginTop: 8, color: '#666' }}>Loading regions...</Text>
        </View>
      );
    }

    // If no regions available for selection, show helpful message
    if (availableRegions.length === 0) {
      return (
        <Card style={{ margin: 16, backgroundColor: '#fff3e0' }}>
          <Card.Content>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#f57c00', marginBottom: 8 }}>
              ℹ️ Region Selection
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
              Your assigned regions don't have top-level categories. Use the nearest region detection above or contact your administrator.
            </Text>
            <Button
              mode="outlined"
              onPress={refreshRegionData}
              style={{ borderColor: '#ff9800' }}
              labelStyle={{ color: '#ff9800' }}
            >
              Refresh Regions
            </Button>
          </Card.Content>
        </Card>
      );
    }

    return (
      <View style={{ paddingHorizontal: 16 }}>
        {/* Breadcrumb showing selected path */}
        {regionHierarchy.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Selected path:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {regionHierarchy.map((regionId, index) => {
                const region = getUserRegions().find((r) => r.administrative_id === regionId);
                return (
                  <Chip
                    key={regionId}
                    mode="outlined"
                    style={{ marginRight: 8, marginBottom: 4 }}
                    textStyle={{ fontSize: 12 }}
                  >
                    {region?.name || regionId}
                  </Chip>
                );
              })}
            </View>
          </View>
        )}

        {/* Current level selector */}
        <CustomDropDownPicker
          schema={{
            label: 'name',
            value: 'administrative_id',
          }}
          placeholder={t('step_location_dropdown_placeholder')}
          value={regionHierarchy[regionHierarchy.length - 1] || null}
          items={getCurrentLevelRegions()}
          setPickerValue={(getValue) => {
            const value = getValue();
            if (value) {
              handleRegionSelection(value, regionHierarchy.length);
            }
          }}
          onSelectItem={(item) => {
            console.log('📍 Region selected via dropdown:', item);
          }}
        />

        {/* Show children if available */}
        {regionHierarchy.length > 0 &&
          (() => {
            const children = getRegionChildren(regionHierarchy[regionHierarchy.length - 1]);
            return (
              children.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                    Select sub-region (optional):
                  </Text>
                  <CustomDropDownPicker
                    schema={{
                      label: 'name',
                      value: 'administrative_id',
                    }}
                    placeholder="Select sub-region"
                    value={null}
                    items={children}
                    setPickerValue={(getValue) => {
                      const value = getValue();
                      if (value) {
                        handleRegionSelection(value, regionHierarchy.length);
                      }
                    }}
                  />
                </View>
              )
            );
          })()}
      </View>
    );
  };

  // Show error state if region error exists
  if (regionError) {
    return (
      <ScrollView style={{ backgroundColor: 'white', flex: 1 }}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{t('step_4')}</Text>
          <Text style={styles.stepDescription}>{t('step_location_description')}</Text>
        </View>
        {renderRegionError()}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: 'white', flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null}>
        <View style={{ padding: 23 }}>
          <Text style={styles.stepText}>{t('step_4')}</Text>
          <Text style={styles.stepDescription}>{t('step_location_description')}</Text>
          <Text style={styles.stepNote}>{t('step_location_body')}</Text>
        </View>

        {renderLocationDetection()}
        {renderRegionSelector()}

        {/* Additional location description */}
        <View style={{ paddingHorizontal: 50, marginTop: 16 }}>
          <Text style={styles.stepNote}>{t('step_location_input_explanation')}</Text>
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
            placeholder={t('step_2_placeholder_3')}
            outlineColor="#dedede"
            theme={theme}
            mode="outlined"
            value={locationDescription}
            onChangeText={setLocationDescription}
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

        {/* Selected region summary */}
        {selectedRegion && (
          <Card style={{ margin: 16, backgroundColor: '#e8f5e8' }}>
            <Card.Content>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2e7d32', marginBottom: 4 }}>
                ✅ Selected Location
              </Text>
              <Text style={{ fontSize: 14, color: '#388e3c' }}>{selectedRegion.name}</Text>
              <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                Level: {selectedRegion.administrative_level} | ID:{' '}
                {selectedRegion.administrative_id}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Next button */}
        <View style={{ paddingHorizontal: 50, marginBottom: 32 }}>
          <Button
            theme={theme}
            disabled={!selectedRegion}
            style={{ alignSelf: 'center', margin: 24 }}
            labelStyle={{ color: 'white', fontFamily: 'Poppins_500Medium' }}
            mode="contained"
            onPress={handleNext}
          >
            {t('next')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default Content;
