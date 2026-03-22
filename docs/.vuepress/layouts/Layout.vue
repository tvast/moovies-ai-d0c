<script setup lang="ts">
import DefaultLayout from '@vuepress/theme-default/layouts/Layout.vue'
import AuthGate from '../components/AuthGate.vue'
</script>

<template>
  <AuthGate>
    <DefaultLayout />
  </AuthGate>
</template>
