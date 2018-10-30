<template>
  <div>
    <router-tabs></router-tabs>
    <router-view></router-view>
  </div>
</template>

<script>
import RouterTabs from './RouterTabs.vue';
import store from '../store';

export default {
  name: 'App',
  components: {
    RouterTabs
  },
  created() {
    chrome.tabs.query({ active: true }, function(tabs) {
      store.dispatch('setCurUrl', tabs[0].url);
    });
  }
};
</script>