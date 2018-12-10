<template>
    <div>
        <button @click='removeLink'>x</button>
        <i @click='toggleSaved' class="fa-star" v-bind:class='{fas: link.saved, far: !link.saved}'></i>
        <a :href='"http://" + link.url' target='_blank'>{{link.url}}</a>
    </div>
</template>

<script>
export default {
  name: 'LinkDiv',
  props: ['initialLink'],
  data() {
    return {
      link: this.initialLink,
    };
  },
  computed: {
    status: function() {
      return this.link.saved ? 'saved' : 'not saved';
    },
  },
  methods: {
    removeLink: function() {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'removeLink',
        storePayload: {
          url: this.link.url,
          targetId: this.$route.params.id,
        },
      });
    },
    toggleSaved: function() {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'saveOrSkipLink',
        storePayload: {
          link: this.link.url,
          action: this.link.saved ? 'skip' : 'save',
          targetId: this.$route.params.id,
        },
      });
    },
  },
};
</script>

<style scoped>
a {
  word-break: all;
}
</style>
