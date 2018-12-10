<template>
  <div>
      <b-breadcrumb :items="crumbs"/>
      <h2>{{$route.params.id}}</h2>
      <div>
        <button @click='renameProfile'>rename</button>
        <button @click='duplicateProfile'>duplicate</button>
        <button @click='deleteProfile'>delete</button>
      </div>
      <ol>
      <li><router-link :to='{ name: "profileLinks", params: { id: profile.name }}'>links ({{numLinks}})</router-link></li>
      <li><router-link :to='{ name: "profileSources", params: { id: profile.name }}'>sources ({{numSources}})</router-link></li>
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
  created: function() {
    this.fetchData();
  },
  data() {
    return {
      profile: {},
      profileId: '',
    };
  },
  methods: {
    deleteProfile: function() {
      this.$store.dispatch('deleteProfile', {
        profileId: this.$route.params.id,
      });
      this.$router.push({ name: 'profiles' });
    },

    fetchData: function() {
      this.profileId = this.$route.params.id;
      this.profile = null;
      let profiles = this.$store.state.profiles;
      for (let i = 0; i < profiles.length; i++) {
        if (profiles[i].name === this.profileId) {
          this.profile = profiles[i];
          break;
        }
      }
    },

    renameProfile: function() {
      var newName = prompt('Enter new name:');
      if (newName == null) {
        return;
      }
      this.$store.dispatch('renameProfile', {
        profileId: this.$route.params.id,
        newName: newName,
      });
      this.$router.push(newName);
    },

    duplicateProfile: function() {
      this.$store.dispatch('duplicateProfile', {
        profileId: this.$route.params.id,
      });
      this.$router.push(this.$store.state.profileDuplicate.name);
    },
  },
  computed: {
    numLinks: function() {
      return Object.keys(this.profile.links).length;
    },
    numSources: function() {
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
          text: this.profileId,
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
