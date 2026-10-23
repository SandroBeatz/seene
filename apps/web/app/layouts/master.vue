<script setup lang="ts">
const { cssVars, themeUi } = useMasterTheme()
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-default text-default" :style="cssVars">
      <UTheme :ui="themeUi">
        <UMain>
          <slot />
        </UMain>
      </UTheme>
    </div>
  </UApp>
</template>
