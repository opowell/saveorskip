<template>
  <div style="height: 100%;">
    <message-modal></message-modal>
    <router-view></router-view>
  </div>
</template>

<script>
import MessageModal from './router/components/MessageModal.vue';

export default {
  name: 'App',
  components: {
    MessageModal,
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
