<template>
  <tr>
      <td>
        <button @click='deleteProfile'>x</button>
      </td>
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
  methods: {
    deleteProfile: function() {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'deleteProfile',
        storePayload: {
          profileId: this.profile.name,
        },
      });
    },
  },
  computed: {
    numLinks() {
      return Object.keys(this.profile.links).length;
    },
    numSources: function() {
      return Object.keys(this.profile.sources).length;
    },
  },
};
</script>
