<template>
    <div>
        <button @click='removeLink'>x</button>
        <a :href='"http://" + link' target='_blank'>{{link}}</a>
    </div>
</template>

<script>
export default {
  name: 'ScrapedLinkDiv',
  props: ['initialLink'],
  data() {
    return {
      link: this.initialLink,
    };
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
  },
};
</script>
