<script setup lang="ts">
const { cssVars, themeUi } = useMasterTheme()
</script>

<template>
  <UApp>
    <div :style="cssVars">
      <UTheme :ui="themeUi">
        <UMain>
          <slot />
        </UMain>
      </UTheme>
    </div>
  </UApp>
</template>
