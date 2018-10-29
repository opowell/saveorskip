<template>
  <div class='main'>
      <div style='display: flex'>
        <div class='title'>
            <router-link :to='{ name: "profile", params: { id: profile.name }}'>
            {{profile.name}}
            </router-link>
        </div>
      </div>
      <div class='props'>
        <div>saved links: {{numSavedLinks}}</div>
        <div>skipped links: {{numSkippedLinks}}</div>
        <div>suggested sources: {{numSugSources}}</div>
        <div>saved sources: {{numSavedSources}}</div>
      </div>
  </div>
</template>

<script>

export default {
  name: 'Profile',
  props: ['profile'],
  computed: {
      savedLinks: function() {
          return this.profile.links.filter(link => link.saved === true)
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
      numSugSources: function() {
          return Object.keys(this.profile.suggestedSources).length;
      },
      numSavedSources: function() {
          return Object.keys(this.profile.savedSources).length;
      },
  }
};
</script>

<style scoped>
    div.main {
        display: flex;
        flex-direction: row;
    }

    .title {
        color: #000;
        font-size: 2rem;
    }

    div.props {
        color: #444;
        display: flex;
        font-size: 1rem;
    }

    div.props > div {
        padding: 5px;
    }
</style>
