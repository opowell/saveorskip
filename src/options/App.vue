<template>
  <div style="height: 100%;">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
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
