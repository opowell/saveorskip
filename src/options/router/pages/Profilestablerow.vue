<template>
  <tr>
      <!-- <td>
        <button @click='deleteProfile'>x</button>
      </td> -->
      <td>
        {{profile.id}}
      </td>
      <td>
        <router-link :to='{ name: "profile", params: { id: profile.id }}'>
          {{profile.name}}
        </router-link>
      </td>
      <td>
        <router-link :to='{ name: "profileLinks", params: { id: profile.id }}'>
          {{ profile.numLinks }}
        </router-link>
      </td>
      <td>
        <router-link :to='{ name: "profileSources", params: { id: profile.id }}'>
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
          profileId: this.profile.id,
        },
      });
    },
  },
  computed: {
    numLinks() {
      if (this.profile.links == null) {
        return 0;
      }
      return Object.keys(this.profile.links).length;
    },
    numSources: function() {
      if (this.profile.sources == null) {
        return 0;
      }
      return Object.keys(this.profile.sources).length;
    },
  },
};
</script>
