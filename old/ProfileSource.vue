<template>
  <tr>
    <td><button @click="removeSource">x</button></td>
    <td>
      <router-link :to="{ name: 'source', params: { profileId: this.$route.params.id, sourceId: source.url } }">
        <i class="fas fa-edit"></i>
      </router-link>
    </td>
    <td><i @click="save" class="fa-star" style="color: green" v-bind:class="{ fas: source.saved, far: !source.saved }"></i></td>
    <td><i @click="skip" class="fa-star" style="color: red" v-bind:class="{ fas: !source.saved, far: source.saved }"></i></td>
    <td>{{ source.points }}</td>
    <td>{{ numLinks }}</td>
    <td>{{ source.nextScrape }}</td>
    <td>
      <a :href="'http://' + source.url" target="_blank">{{ source.url }}</a>
    </td>
  </tr>
</template>

<script>
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
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'removeSource',
        storePayload: {
          url: this.source.url,
          targetId: this.$route.params.id,
        },
      });
      this.$parent.fetchData();
    },
    save: function() {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'setSourceSaved',
        storePayload: {
          source: this.source.url,
          saved: true,
          targetId: this.$route.params.id,
        },
      });
    },
    skip: function() {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'setSourceSaved',
        storePayload: {
          source: this.source.url,
          saved: false,
          targetId: this.$route.params.id,
        },
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
