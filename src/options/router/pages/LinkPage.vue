<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <h2>{{ $route.params.linkId }}</h2>
    <div>
      <button>scrape</button>
      <button @click="deleteLink">delete</button>
      <button @click="saveLink">save</button>
      <button @click="reset" type="button">reset</button>
      <button>remove property</button>
      <select>
        <option v-for="fieldName in fieldNames" :key="fieldName + renderCount" :value="fieldName">
          {{ fieldName }}
        </option>
      </select>
    </div>
    <div>
      <b-input-group style="align-items: center;">
        <b-form-input v-model="filter" placeholder="Add / filter" />
        <b-input-group-append>
          <b-btn variant="primary" :disabled="!canAdd" @click="addProperty">Add</b-btn>
        </b-input-group-append>
      </b-input-group>
    </div>
    <b-table show-empty hover stacked="md" :items="fields" :fields="fieldDefns" :filter="filter">
      <template v-slot:cell(name)="data">
        <div v-if="['profileId', 'url'].includes(data.item.name)">{{ data.item.name }}</div>
        <input v-else type="text" @change="changeName(data.item.name, $event)" :value="data.item.name" style="width: 100%;" />
      </template>
      <template v-slot:cell(value)="data">
        <input type="text" @change="changeValue(data.item.name, $event)" :value="data.item.value" style="width: 100%" />
      </template>
    </b-table>
  </div>
</template>

<script>
import * as idb from '../../../store/idb.js';
import Vue from 'vue';

export default {
  name: 'LinkPage',
  watch: {
    '$route.params.profileId'(id) {
      this.fetchData();
    },
    '$route.params.linkId'(id) {
      this.fetchData();
    },
  },
  data() {
    return {
      renderCount: 0,
      fieldDefns: [
        { key: 'name', label: 'Name', sortable: true, class: 'col-name' },
        { key: 'value', label: 'Value', sortable: true, class: 'col-value' },
      ],
      filter: null,
      newLink: {},
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    changeName(field, event) {
      let val = this.newLink[field];
      delete this.newLink[field];
      this.newLink[event.target.value] = val;
    },
    changeValue(field, event) {
      this.newLink[field] = event.target.value;
    },
    addProperty() {
      Vue.set(this.link, this.filter, '');
    },
    removeProperty(field) {
      delete this.newLink[field];
    },
    saveLink() {
      idb.deleteLink({
        profileId: this.$route.params.profileId,
        linkId: this.$route.params.linkId,
      });
      idb.saveLink(this.newLink);
      if (this.newLink.profileId != this.profileId || this.newLink.url != this.linkId) {
        this.$router.push({
          name: 'link',
          params: {
            profileId: this.newLink.profileId,
            linkId: this.newLink.url,
          },
        });
      } else {
        this.fetchData();
      }
    },
    deleteLink() {
      idb.deleteLink({
        profileId: this.$route.params.profileId,
        linkId: this.$route.params.linkId,
      });
      this.$router.push({ name: 'profileLinks', params: { id: this.profileId } });
    },
    fetchData() {
      idb.loadLink({
        profileId: this.$route.params.profileId,
        linkId: this.$route.params.linkId,
      });
    },
    reset() {
      debugger;
      this.renderCount++;
      let out = this.$store.state.link;
      Vue.set(this, 'newLink', {});
      for (let i in out) {
        this.newLink[i] = out[i];
      }
    },
  },
  computed: {
    canAdd() {
      return this.filter != null && this.filter.length > 0 && this.link[this.filter] == null;
    },
    fields() {
      let out = [];
      for (let i = 0; i < this.fieldNames.length; i++) {
        let fieldName = this.fieldNames[i];
        out.push({
          name: fieldName,
          value: this.newLink[fieldName],
        });
      }
      return out;
    },
    fieldNames() {
      let out = [];
      for (let a in this.newLink) {
        out.push(a);
      }
      return out;
    },
    linkId() {
      return this.$route.params.linkId;
    },
    link() {
      this.reset();
      return this.$store.state.link;
    },
    profileId() {
      return this.$route.params.profileId;
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
          text: this.profileId + '',
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

button {
  margin: 5px;
  align-self: center;
}
</style>
