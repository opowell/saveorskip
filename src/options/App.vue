<template>
  <div>
    <router-view></router-view>
  </div>
</template>

<script>
import store from '../store';

export default {
  name: 'App',
  mounted() {
    chrome.tabs.query({ active: true }, function(tabs) {
      store.dispatch('setCurPage', { url: tabs[0].url });
    });
  },
};
</script>

<style>
.breadcrumb-item + .breadcrumb-item::before {
  content: '>' !important;
}

i {
  color: #888;
  margin: 5px;
}

i:hover {
  color: #000;
  cursor: pointer;
}
</style>
