<template>
  <div>
      <b-breadcrumb :items="crumbs"/>
      <h2>{{profile == null ? '' : profile.name}} ({{profileId}})</h2>
      <div>
        <button @click='renameProfile'>rename</button>
        <button @click='duplicateProfile'>duplicate</button>
        <button @click='deleteProfile'>delete</button>
      </div>
      <ol>
      <li><router-link :to='{ name: "profileLinks", params: { id: profileId }}'>links ({{numLinks}})</router-link></li>
      <li><router-link :to='{ name: "profileSources", params: { id: profileId }}'>sources ({{numSources}})</router-link></li>
      </ol>
  </div>
</template>

<script>
export default {
  name: 'ProfilePage',
  components: {},
  watch: {
    '$route.params.id': function(id) {
      this.fetchData();
    },
  },
  created() {
    this.fetchData();
  },
  methods: {
    deleteProfile: function() {
      this.$store.dispatch('deleteProfile', {
        profileId: this.$route.params.id,
      });
      this.$router.push({ name: 'profiles' });
    },

    fetchData() {
      this.$store.dispatch('loadProfile', { profileId: this.$route.params.id });
    },

    renameProfile: function() {
      var newName = prompt('Enter new name:');
      if (newName == null) {
        return;
      }
      this.$store.dispatch('renameProfile', {
        profileId: this.profile.id,
        newName: newName,
      });
      // this.$router.push(newName);
    },

    duplicateProfile: function() {
      this.$store.dispatch('duplicateProfile', {
        profileId: this.$route.params.id,
      });
      this.$router.push(this.$store.state.profileDuplicate.name);
    },
  },
  computed: {
    profileId() {
      return this.profile == null ? '' : this.profile.id;
    },
    profile() {
      return this.$store.state.profile;
    },
    numLinks: function() {
      if (this.profile == null) {
        return 0;
      }
      return this.profile.numLinks;
      // return Object.keys(this.profile.links).length;
    },
    numSources: function() {
      if (this.profile == null) {
        return 0;
      }
      if (this.profile.sources == null) {
        return 0;
      }
      return Object.keys(this.profile.sources).length;
    },
    crumbs: function() {
      return [
        {
          text: 'Home',
          href: '#/',
        },
        {
          text: 'Profiles',
          href: '#/profiles',
        },
        {
          text: this.profileId + '',
          href: '#/profile/' + this.profileId,
        },
      ];
    },
  },
};
</script>

<style scoped>
div.props {
  color: #444;
  display: flex;
  font-size: 1rem;
  flex-direction: column;
}

div.props > div {
  padding: 5px;
}

button {
  margin: 5px;
  align-self: center;
}
</style>
