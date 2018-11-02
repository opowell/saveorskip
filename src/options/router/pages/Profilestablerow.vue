<template>
  <tr>
      <td>
        <router-link :to='{ name: "profile", params: { id: profile.name }}'>
          {{profile.name}}
        </router-link>
      </td>
      <td>{{ numLinks }}</td>
      <td>{{ numSavedLinks }}</td>
      <td>{{ numSkippedLinks }}</td>
  </tr>
</template>

<script>
export default {
  name: 'Profilestablerow',
  props: {
    profile: {
      type: Object,
      required: true,
    },
  },
  computed: {
    numLinks() {
      return this.profile.links.length;
    },
    savedLinks: function() {
      return this.profile.links.filter(link => link.saved === true);
    },
    skippedLinks: function() {
      return this.profile.links.filter(link => link.saved === false);
    },
    numSavedLinks: function() {
      return this.savedLinks.length;
    },
    numSkippedLinks: function() {
      return this.skippedLinks.length;
    },
  },
};
</script>
