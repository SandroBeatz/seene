import { useRef, useState } from 'react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Sheet, Text } from '@/shared/ui';
import { UIKitExampleCard, UIKitScreen } from '@/widgets/uikit-catalog';

export default function UIKitModalsScreen() {
  const { t } = useTranslation();
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const sheetRef = useRef<BottomSheetModal>(null);

  return (
    <>
      <UIKitScreen>
        <UIKitExampleCard
          title={t('uikit.modals.standard')}
          description={t('uikit.modals.standardDescription')}
          recommendation={t('uikit.recommended.routeModal')}
          source="src/app/(app)/(modals)/appointment-form.tsx"
          code="presentation: 'modal'"
          action={
            <Button
              label={t('uikit.openExample')}
              variant="secondary"
              onPress={() => router.push('/appointment-form')}
            />
          }
        />
        <UIKitExampleCard
          title={t('uikit.modals.fullscreen')}
          description={t('uikit.modals.fullscreenDescription')}
          recommendation={t('uikit.recommended.fullscreen')}
          source="src/app/(app)/(modals)/quick-create/_layout.tsx"
          code="presentation: 'fullScreenModal'"
          action={
            <Button
              label={t('uikit.openExample')}
              variant="secondary"
              onPress={() => router.push('/quick-create')}
            />
          }
        />
        <UIKitExampleCard
          title={t('uikit.modals.formSheet')}
          description={t('uikit.modals.formSheetDescription')}
          recommendation={t('uikit.recommended.formSheet')}
          source="src/app/(app)/(modals)/checkout/[appointmentId].tsx"
          code="sheetAllowedDetents: [0.45, 0.85]"
          badge={t('uikit.platformSpecific')}
          badgeTone="warning"
          action={
            <Button
              label={t('uikit.openExample')}
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/checkout/[appointmentId]',
                  params: { appointmentId: 'uikit-appointment' },
                })
              }
            />
          }
        />
        <UIKitExampleCard
          title={t('uikit.modals.confirmation')}
          description={t('uikit.modals.confirmationDescription')}
          recommendation={t('uikit.recommended.rnModal')}
          source="src/shared/ui/Modal/Modal.tsx"
          code="<Modal visible onRequestClose={close}>…</Modal>"
          action={
            <Button
              label={t('uikit.openExample')}
              variant="secondary"
              onPress={() => setConfirmationVisible(true)}
            />
          }
        />
        <UIKitExampleCard
          title={t('uikit.modals.sheet')}
          description={t('uikit.modals.sheetDescription')}
          recommendation={t('uikit.recommended.sheet')}
          source="src/shared/ui/Sheet/Sheet.tsx"
          code="sheetRef.current?.present()"
          action={
            <Button
              label={t('uikit.openExample')}
              variant="secondary"
              onPress={() => sheetRef.current?.present()}
            />
          }
        />
        <UIKitExampleCard
          title={t('uikit.modals.dismiss')}
          description={t('uikit.modals.dismissDescription')}
          recommendation={t('uikit.recommended.dismiss')}
          source="src/app/(app)/(modals)/quick-create/review.tsx"
          code="router.dismissTo('/')"
        />
      </UIKitScreen>

      <Sheet ref={sheetRef} snapPoints={['35%']}>
        <Text variant="title3">{t('uikit.modals.sheet')}</Text>
        <Text variant="body" color="secondary">
          {t('uikit.modals.sheetDescription')}
        </Text>
      </Sheet>

      <Modal
        visible={confirmationVisible}
        onRequestClose={() => setConfirmationVisible(false)}
        title={t('uikit.modals.confirmation')}
        footer={
          <>
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={() => setConfirmationVisible(false)}
            />
            <Button
              label={t('common.confirm')}
              variant="danger"
              onPress={() => setConfirmationVisible(false)}
            />
          </>
        }>
        <Text variant="body" color="secondary">
          {t('uikit.modals.confirmationDescription')}
        </Text>
      </Modal>
    </>
  );
}
