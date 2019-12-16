<template>
  <div>
    <button @click="removeLink">x</button>
    <a :href="'http://' + link" target="_blank">{{ link }}</a>
  </div>
</template>

<script>
import * as idb from '../../../store/idb.js';

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
      idb.removeLink({
        url: this.link.url,
        targetId: this.$route.params.id,
      });
    },
  },
};
</script>
