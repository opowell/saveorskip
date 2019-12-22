<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <objects-table ref="table" :object="profiles" @create="addProfile" @click="openProfile" :show-del="false" :ineditable-row-names="[]" />
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';

export default {
  name: 'Profiles',
  components: {
    ObjectsTable,
  },
  mounted() {
    this.fetchData();
  },
  computed: {
    profiles() {
      return this.$store.state.profiles;
    },
    crumbs() {
      return [
        {
          text: 'Home',
          href: '#/',
        },
        {
          text: 'Profiles',
          href: '#/profiles',
        },
      ];
    },
  },
  methods: {
    fetchData() {
      idb.fetchProfiles();
    },
    addProfile(inputStr) {
      idb.addProfile(inputStr);
    },
    openProfile({ item, index, event }) {
      this.$router.push({ name: 'profile', params: { id: item.id } });
    },
  },
};
</script>
