<template>
  <tr>
      <td><button @click='removeSource'>x</button></td>
      <td>
        <router-link :to='{ name: "source", params: { profileId: this.$route.params.id, sourceId: source.url }}'>
          <i class="fas fa-edit"></i>
        </router-link>
      </td>
      <td><i @click='toggleSaved' class="fa-star" v-bind:class='{fas: source.saved, far: !source.saved}'></i></td>
      <td>{{ source.points }}</td>
      <td>{{ numLinks }}</td>
      <td>{{ source.nextScrape }}</td>
      <td><a :href='"http://" + source.url' target='_blank'>{{source.url}}</a></td>
  </tr>
</template>

<script>
import store from '../../../store';

export default {
  name: 'SourceDiv',
  props: ['source'],
  computed: {
    numLinks() {
      return this.source.scrapedLinks.length;
    },
  },
  methods: {
    removeSource: function() {
      store.dispatch('removeSource', {
        url: this.source.url,
        targetId: this.$route.params.id,
      });
      this.$parent.fetchData();
    },
    toggleSaved: function() {
      this.$store.dispatch('setSourceSaved', {
        source: this.source.url,
        saved: !this.source.saved,
        targetId: this.$route.params.id,
      });
    },
  },
};
</script>

<style scoped>
button {
  margin: 5px;
  align-self: center;
}
</style>
