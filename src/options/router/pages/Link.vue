<template>
  <div style="height: 100%;">
    <b-modal id="deleteLinkModal" title="Delete Link" @ok="deleteObject" no-fade>
      <p class="my-4">Are you sure you want to delete this link?</p>
    </b-modal>
    <objects-table
      ref="table"
      :crumbs="crumbs"
      :object="link"
      :ineditable-row-names="['profileId', 'url', 'title', 'timeAdded', 'saved']"
      :ineditable-col-names="['profileId']"
      @save="saveLink"
      :fetchInitialData="fetchInitialData"
      @deleteObject="askDeleteObject"
      :rowNamesToSkip="['profileId']"
      :addItemText="'Add Field...'"
    >
      <template v-slot:header>
        <button @click="openLink(true)" title="Open this link in a new window.">Open</button>
        <button @click="scrapeLink" title="Open and find sources of this link.">Find sources</button>
      </template>
    </objects-table>
  </div>
</template>

<script>
import * as idb from '../../../store/idb.ts';
import Vue from 'vue';
import ObjectsTable from '../components/ObjectsTable.vue';
import { convertId } from '../../../Utils.ts';
import { Hrefs } from '../../Constants';

export default {
  name: 'ProfileLink',
  components: {
    ObjectsTable,
  },
  data() {
    return {
      link: null,
      profile: null,
    };
  },
  methods: {
    async scrapeLink() {
      chrome.runtime.sendMessage({ action: 'saveSourcesOfUrl', url: this.link.url });
      this.openLink({ active: false });
    },
    openLink({ active }) {
      chrome.tabs.create({ url: 'http://' + this.link.url, active });
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
      // eslint-disable-next-line eqeqeq
      if (this.link.profileId != this.profileId || this.link.url != this.linkId) {
        this.$router.push({
          name: 'link',
          params: {
            profileId: this.link.profileId,
            linkId: this.link.url,
          },
        });
      }
      this.$refs.table.callFetchData();
    },
    askDeleteObject() {
      this.$bvModal.show('deleteLinkModal');
    },
    deleteObject() {
      idb.deleteLink({
        profileId: this.profileId,
        linkId: this.linkId,
      });
      this.$router.push(Hrefs.links(this.profileId));
    },
    async fetchInitialData() {
      this.link = await idb.loadLink({
        profileId: this.profileId,
        linkId: this.linkId,
      });
      this.profile = await idb.getProfile(this.profileId);
    },
  },
  computed: {
    canAddProperty() {
      return this.filter != null && this.filter.length > 0 && (this.link == null || this.link[this.filter] == null);
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
      return convertId(this.$route.params.linkId);
    },
    profileId() {
      return convertId(this.$route.params.profileId);
    },
    profileName() {
      if (this.profile == null) {
        return '';
      }
      if (typeof this.profile.name === 'object') {
        return JSON.stringify(this.profile.name);
      }
      if (this.profile.name == null || this.profile.name === '') {
        return decodeURIComponent(this.profile.id);
      }
      return this.profile.name;
    },
    crumbs() {
      return [
        {
          text: 'Home',
          href: '#/',
        },
        {
          text: 'Profiles',
          href: Hrefs.profiles(),
        },
        {
          text: this.profileName,
          href: Hrefs.profile(this.profileId),
        },
        {
          text: 'Links',
          href: Hrefs.links(this.profileId),
        },
        {
          text: this.linkId,
          href: Hrefs.link(this.profileId, this.linkId),
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
