<script setup lang="ts">
const { cssVars, themeUi } = useMasterTheme()
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-white" :style="cssVars">
      <UTheme :ui="themeUi">
        <UMain>
          <slot />
        </UMain>
      </UTheme>
    </div>
  </UApp>
</template>
