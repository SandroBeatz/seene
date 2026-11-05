<template>
  <div role="status" aria-busy="true" class="flex flex-1 flex-col">
    <span class="sr-only">{{ $ts('master.page.loading') }}</span>

    <div aria-hidden="true" class="flex flex-1 flex-col">
      <!-- Hero -->
      <span class="seene-skeleton h-56" />
      <div class="relative -mt-13 flex flex-col gap-3.5 px-5">
        <span class="size-23 rounded-full border-4 border-(--ui-bg) bg-(--ui-bg)">
          <span class="seene-skeleton size-full rounded-full" />
        </span>
        <div class="flex flex-col gap-2 py-0.5">
          <span class="seene-skeleton h-7 w-52 rounded-md" />
          <span class="seene-skeleton h-4 w-36 rounded-md" />
          <span class="seene-skeleton h-4 w-24 rounded-md" />
        </div>
        <span class="seene-skeleton h-18 rounded-[16px]" />
      </div>

      <!-- About and contacts -->
      <div class="flex flex-col gap-3.5 px-5 pt-3.5">
        <div class="flex flex-col gap-2 py-1">
          <span class="seene-skeleton h-3.5 rounded-md" />
          <span class="seene-skeleton h-3.5 rounded-md" />
          <span class="seene-skeleton h-3.5 w-2/3 rounded-md" />
        </div>
        <div class="grid grid-cols-5 gap-1.5">
          <div v-for="index in 4" :key="index" class="flex flex-col items-center gap-1.5">
            <span class="seene-skeleton size-13 rounded-full" />
            <span class="seene-skeleton h-2.5 w-10 rounded-md" />
          </div>
        </div>
      </div>

      <!-- Works -->
      <div class="flex flex-col gap-3.5 px-5 pt-8">
        <span class="seene-skeleton h-6 w-28 rounded-md" />
        <div class="grid grid-cols-3 gap-1 overflow-hidden rounded-[16px]">
          <span v-for="index in 6" :key="index" class="seene-skeleton aspect-square" />
        </div>
      </div>

      <!-- Services -->
      <div class="px-5 pt-8 pb-2">
        <span class="seene-skeleton mb-2 h-6 w-24 rounded-md" />
        <div
          v-for="index in 3"
          :key="index"
          class="flex items-center gap-3.5 border-b border-default py-3"
        >
          <span class="seene-skeleton size-14 shrink-0 rounded-[14px]" />
          <div class="flex flex-1 flex-col gap-2">
            <span class="seene-skeleton h-4 w-3/5 rounded-md" />
            <span class="seene-skeleton h-3 w-2/5 rounded-md" />
          </div>
        </div>
      </div>

      <!-- Book bar -->
      <div class="sticky bottom-0 mt-auto px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <span class="seene-skeleton h-15 rounded-[16px]" />
      </div>
    </div>
  </div>
</template>
