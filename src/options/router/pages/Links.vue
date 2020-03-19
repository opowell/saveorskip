<template>
  <div style="height: 100%;">
    <b-modal id="addLinkModal" title="Add Link" @ok="addLink" no-fade>
      <div>
        <span>url:</span>
        <input type="text" id="addLinkUrlInput" v-on:keyup.enter="addLink" />
      </div>
      <div>
        <span>title:</span>
        <input type="text" id="addLinkTitleInput" v-on:keyup.enter="addLink" />
      </div>
    </b-modal>
    <objects-table
      ref="table"
      :object="links"
      @create="addLinkPrompt"
      @click="openLink"
      :colNamesToSkip="['profileId']"
      :colLabels="{ timeAdded: 'Time added' }"
      :crumbs="crumbs"
      @deleteSelectedRows="deleteLinks"
      sortBy="timeAdded"
      :sortDesc="true"
      :givenCols="['saved', 'url', 'title', 'timeAdded']"
      :fetchData="fetchData"
      :addItemText="'Add Link...'"
    />
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';
import { convertId } from '../../../Utils.js';

export default {
  name: 'ProfileLinks',
  components: {
    ObjectsTable,
  },
  watch: {
    '$route.params.id': async function() {
      await this.fetchData();
    },
  },
  data() {
    return {
      profile: null,
      links: [],
    };
  },
  methods: {
    deleteLinks(selection) {
      for (let i in selection) {
        idb.deleteLink({
          profileId: selection[i].profileId,
          linkId: selection[i].url,
        });
      }
    },
    async fetchData() {
      this.links.splice(0, this.links.length);
      let fetchedLinks = await idb.getLinks(this.profileId);
      this.links.push(...fetchedLinks);
      this.profile = await idb.getProfile(this.profileId);
    },
    addLinkPrompt() {
      this.$bvModal.show('addLinkModal');
    },
    async addLink() {
      let url = document.getElementById('addLinkUrlInput').value;
      let title = document.getElementById('addLinkTitleInput').value;
      let link = {
        targetId: this.profileId,
        action: 'save',
        link: { url, title },
      };
      await idb.saveOrSkipLink(link);
      await this.fetchData();
    },
    openLink({ item, index, event }) {
      this.$router.push({
        name: 'profileLink',
        params: {
          profileId: this.profileId,
          linkId: item.url,
        },
      });
    },
  },
  computed: {
    numLinks() {
      return Object.keys(this.links).length;
    },
    profileId() {
      return convertId(this.$route.params.id);
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
          href: '#/profiles?filters=generatedBy,eq,user',
        },
        {
          text: this.profileName,
          href: '#/profile/' + encodeURIComponent(this.profileId),
        },
        {
          text: 'Links',
          href: '#/profile/' + encodeURIComponent(this.profileId) + '/links?filters=saved,eq,true',
        },
      ];
    },
  },
};
</script>
