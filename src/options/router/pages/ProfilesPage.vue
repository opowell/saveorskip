<template>
  <div>
        <h2>Profiles</h2>
        <div style='display: flex'>
          <input v-model='profileInput'>
          <button id='addProfile' @click='addProfile'>add</button>
        </div>
        <profile v-for='profile in profilesComp' :profile='profile' :key='profile.name'></profile>
  </div>
</template>

<script>
import Profile from './Profile.vue';

export default {
  name: 'ProfilesPage',
  components: {
    Profile,
  },
  data: function() {
    return {
      profileInput: this.$store.getters.profileInput,
      profiles: this.$store.getters.profileObjs  
    }
  },
  computed: {
    profilesComp () {
      return this.$store.getters.profileObjs
    }
  },
  methods: {
    addProfile: function() {
      this.$store.dispatch('addProfile', this.profileInput);
      this.profileInput = '';
    }
  },
};
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
