<template>
  <tr>
      <td>
        <router-link :to='{ name: "profile", params: { id: profile.name }}'>
          {{profile.name}}
        </router-link>
      </td>
      <td>
        <router-link :to='{ name: "profileLinks", params: { id: profile.name }}'>
          {{ numLinks }}
        </router-link>
      </td>
      <td>
        <router-link :to='{ name: "profileSources", params: { id: profile.name }}'>
          {{ numSources }}
        </router-link>
      </td>
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
