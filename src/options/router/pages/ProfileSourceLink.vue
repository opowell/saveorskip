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
      :ineditable-row-names="['profileId', 'sourceId', 'url']"
      :ineditable-col-names="['profileId', 'sourceId']"
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
  name: 'ProfileSourceLink',
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
    '$route.params.sourceId'(id) {
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
    addProperty() {
      Vue.set(this.link, this.filter, '');
      this.$refs.table.changesPending = true;
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
      this.$router.push({ name: 'profileSourceLinks', params: { profileId: this.profileId, sourceId: this.sourceId } });
    },
    fetchData() {
      idb.loadProfileSourceLink({
        profileId: this.$route.params.profileId,
        sourceId: this.$route.params.sourceId,
        linkId: this.$route.params.linkId,
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
    sourceId() {
      return this.$route.params.sourceId;
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
      return this.$store.state.profileSourceLink;
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
      let profileId = encodeURIComponent(this.$route.params.profileId);
      let sourceId = encodeURIComponent(this.$route.params.sourceId);
      let linkId = encodeURIComponent(this.$route.params.linkId);

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
          href: '#/profile/' + profileId,
        },
        {
          text: 'Sources',
          href: '#/profile/' + profileId + '/sources',
        },
        {
          text: this.$route.params.sourceId,
          href: '#/profile/' + profileId + '/sources/' + sourceId,
        },
        {
          text: 'Links',
          href: '#/profile/' + profileId + '/sources/' + sourceId + '/links',
        },
        {
          text: this.$route.params.linkId,
          href: '#/profile/' + profileId + '/sources/' + sourceId + '/links/' + linkId,
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
