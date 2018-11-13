<template>
  <tr>
      <td>
        <router-link :to='{ name: "profile", params: { id: profile.name }}'>
          {{profile.name}}
        </router-link>
      </td>
      <td>{{ numLinks }}</td>
      <td>{{ numSources }}</td>
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
    numSources: function() {
      return Object.keys(this.profile.sources).length;
    },
  },
};
</script>
