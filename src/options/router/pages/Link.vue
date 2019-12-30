<template>
  <div>
    <b-modal id="deleteModal" title="Delete Link" @ok="deleteObject">
      <p class="my-4">Are you sure you want to delete this link?</p>
    </b-modal>
    <b-breadcrumb :items="crumbs" />
    <objects-table
      ref="table"
      :object="link"
      @create="addProperty"
      :ineditable-row-names="['profileId', 'url']"
      :ineditable-col-names="['profileId']"
      @save="saveLink"
      :fetchData="fetchData"
      @deleteObject="askDeleteObject"
    >
      <template v-slot:header>
        <button @click="openLink(true)" title="Open this link in a new window.">Open</button>
        <button @click="scrapeLink" title="Open and find sources of this link.">Find sources</button>
      </template>
    </objects-table>
  </div>
</template>

<script>
import * as idb from '../../../store/idb.js';
import Vue from 'vue';
import ObjectsTable from '../components/ObjectsTable.vue';

export default {
  name: 'ProfileLink',
  components: {
    ObjectsTable,
  },
  watch: {
    '$route.params.profileId'(id) {
      this.fetchData();
    },
    '$route.params.linkId'(id) {
      this.fetchData();
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async scrapeLink() {
      chrome.runtime.sendMessage({ action: 'saveSourcesOfUrl', url: this.link.url });
      this.openLink({ active: false });
    },
    openLink({ active }) {
      chrome.tabs.create({ url: 'http://' + this.link.url, active });
    },
    tryToAddProperty() {
      if (this.canAddProperty) {
        this.addProperty();
      }
    },
    addProperty() {
      Vue.set(this.link, this.filter, '');
      this.$refs.table.changesPending = true;
    },
    removeProperty() {
      if (this.removePropertySelect == null) {
        return;
      }
      Vue.delete(this.link, this.removePropertySelect);
      this.changesPending = true;
    },
    saveLink() {
      idb.deleteLink({
        profileId: this.$route.params.profileId,
        linkId: this.$route.params.linkId,
      });
      idb.saveLink(this.link);
      if (this.link.profileId != this.profileId || this.link.url != this.linkId) {
        this.$router.push({
          name: 'link',
          params: {
            profileId: this.link.profileId,
            linkId: this.link.url,
          },
        });
      }
      this.fetchData();
    },
    askDeleteObject() {
      this.$bvModal.show('deleteModal');
    },
    deleteObject() {
      idb.deleteLink({
        profileId: this.profileId,
        linkId: this.linkId,
      });
      this.$router.push({ name: 'profileLinks', params: { id: this.profileId } });
    },
    fetchData() {
      idb.loadLink({
        profileId: this.profileId,
        linkId: this.linkId,
      });
      idb.loadProfile({
        profileId: this.$route.params.profileId,
      });
      this.changesPending = false;
    },
    reset() {
      this.filter = '';
      this.fetchData();
    },
  },
  computed: {
    canAddProperty() {
      return this.filter != null && this.filter.length > 0 && (this.link == null || this.link[this.filter] == null);
    },
    profiles() {
      return this.$store.state.profiles;
    },
    fields() {
      let out = [];
      for (let i = 0; i < this.fieldNames.length; i++) {
        let fieldName = this.fieldNames[i];
        out.push({
          name: fieldName,
          value: this.link[fieldName],
        });
      }
      return out;
    },
    removableFieldNames() {
      let out = [];
      for (let i in this.fieldNames) {
        let fieldName = this.fieldNames[i];
        if (!['saved', 'profileId', 'url'].includes(fieldName)) {
          out.push(fieldName);
        }
      }
      return out;
    },
    fieldNames() {
      let out = [];
      for (let a in this.link) {
        out.push(a);
      }
      return out;
    },
    linkId() {
      return this.$route.params.linkId;
    },
    link() {
      return this.$store.state.link;
    },
    profileId() {
      return this.$route.params.profileId;
    },
    profile() {
      return this.$store.state.profile;
    },
    profileName() {
      return this.profile == null ? '' : this.profile.name;
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
        {
          text: this.profileName,
          href: '#/profile/' + this.profileId,
        },
        {
          text: 'Links',
          href: '#/profile/' + this.profileId + '/links',
        },
        {
          text: this.linkId,
          href: '#/profile/' + this.profileId + '/sources/' + this.linkId,
        },
      ];
    },
  },
};
</script>

<style>
.col-name {
  width: 20rem;
}
</style>

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
</style>