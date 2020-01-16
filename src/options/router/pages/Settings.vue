<template>
  <div style="height: 100%;">
    <b-breadcrumb :items="crumbs" />
    <h4>Settings</h4>
    <div style="display: flex; align-items: baseline; margin-top: 2rem;">
      <span style="margin-right: 2rem;">Storage:</span>
      <span>
        <b-form-group>
          <b-form-radio v-model="selected" name="some-radios" value="A">Local only (IndexedDB)</b-form-radio>
          <b-form-radio v-model="selected" name="some-radios" value="B" disabled>Remote (coming soon!)</b-form-radio>
        </b-form-group>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Settings',
  data() {
    return {
      selected: 'A',
    };
  },
  computed: {
    crumbs() {
      return [
        {
          text: 'Home',
          href: '#/',
        },
        {
          text: 'Settings',
          href: '#/settings',
        },
      ];
    },
  },
};
</script>
