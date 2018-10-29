<template>
  <div>
    <router-tabs></router-tabs>
    <router-view></router-view>
  </div>
</template>

<script>
import RouterTabs from './RouterTabs.vue';

export default {
  name: 'App',
  components: {
    RouterTabs
  }
};
</script>