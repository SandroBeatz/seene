<script setup lang="ts">
const { $ts, $localePath } = useI18n()
</script>

<template>
  <footer class="flex flex-col items-center gap-2 px-5 pt-7 pb-6 text-xs text-muted">
    <ULink :to="$localePath('/')" class="inline-flex items-center gap-2 hover:text-default">
      {{ $ts('master.footer.madeWith') }}
    </ULink>
    <ULink :to="$localePath('/privacy')" class="underline-offset-2 hover:underline">
      {{ $ts('master.footer.privacy') }}
    </ULink>
  </footer>
</template>
