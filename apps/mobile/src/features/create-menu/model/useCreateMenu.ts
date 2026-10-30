/**
 * The "+" next to the tab bar: a native action sheet with what a master creates —
 * an appointment, a time block, a client. iOS shows the system sheet; Android, which
 * has none, gets the same choices in an alert.
 */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActionSheetIOS, Alert } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

type CreateAction = 'appointment' | 'block' | 'client';

const ACTIONS: CreateAction[] = ['appointment', 'block', 'client'];

export function useCreateMenu() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const run = (action: CreateAction) => {
    if (action === 'appointment') router.push('/quick-create');
    else if (action === 'client') router.push('/client/new');
    // Time blocks arrive with the calendar.
    else Alert.alert(t('createMenu.block'), t('createMenu.blockSoon'));
  };

  return () => {
    const labels = ACTIONS.map((action) => t(`createMenu.${action}`));
    if (process.env.EXPO_OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...labels, t('common.cancel')],
          cancelButtonIndex: labels.length,
          // Follow the app's theme toggle, not only the system appearance.
          userInterfaceStyle: theme.name === 'dark' ? 'dark' : 'light',
        },
        (index) => {
          const action = ACTIONS[index];
          if (action) run(action);
        },
      );
      return;
    }
    // An Android alert holds three buttons: the actions; a tap outside cancels.
    Alert.alert(
      t('createMenu.title'),
      undefined,
      ACTIONS.map((action, index) => ({ text: labels[index], onPress: () => run(action) })),
      { cancelable: true },
    );
  };
}
