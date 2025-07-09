import * as React from 'react';
import { Animated, ToastAndroid } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Network from 'expo-network';

export function NetworkStatus({ message, checkTime = 10000 }) {
  const { t } = useTranslation();
  const defaultMessage = t('Internet connection has been lost!');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [isOnline, setIsOnline] = React.useState(undefined);

  const showToast = () => {
    ToastAndroid.show(message || defaultMessage, ToastAndroid.SHORT);
  };

  React.useEffect(() => {
    const interval = setInterval(async () => {
      const { isConnected } = await Network.getNetworkStateAsync();

      setIsOnline((prev) => (prev !== isConnected ? isConnected : prev));
    }, checkTime);
    return () => {
      clearInterval(interval);
    };
  }, [checkTime]);

  React.useEffect(() => {
    if (true || (!isOnline && isOnline !== undefined)) {
      showToast();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, fadeAnim]);
  return <></>;
}
