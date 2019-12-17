<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <div>
      <button>scrape</button>
      <button @click="deleteLink">delete...</button>
      <button :class="{ 'btn-primary': changesPending }" @click="saveLink">save</button>
      <button :class="{ 'btn-primary': changesPending }" @click="reset">reset</button>
      <button :disabled="removePropertySelect == null" @click="removeProperty">remove property</button>
      <select v-model="removePropertySelect">
        <option v-for="fieldName in removableFieldNames" :key="fieldName" :value="fieldName">
          {{ fieldName }}
        </option>
      </select>
    </div>
    <div>
      <b-input-group style="align-items: center;">
        <b-form-input v-model="filter" placeholder="Add / filter" v-on:keyup.enter="tryToAddProperty" />
        <b-input-group-append>
          <b-btn variant="primary" :disabled="!canAddProperty" @click="addProperty">Add</b-btn>
        </b-input-group-append>
      </b-input-group>
    </div>
    <b-table show-empty hover stacked="md" :items="fields" :fields="fieldDefns" :filter="filter">
      <template v-slot:cell(name)="data">
        <div v-if="data.item.name === 'profileId'">profile</div>
        <div v-else-if="'url' === data.item.name">{{ data.item.name }}</div>
        <div v-else-if="'saved' === data.item.name">{{ data.item.name }}</div>
        <input v-else type="text" @change="changeName(data.item.name, $event)" :value="data.item.name" style="width: 100%;" />
      </template>
      <template v-slot:cell(value)="data">
        <select v-if="data.item.name === 'profileId'" @change="changeValue(data.item.name, $event)">
          <option v-for="profile in profiles" :key="profile.id" value="profile.id" :selected="profile.id == data.item.value">
            {{ profile.name }}
          </option>
        </select>
        <select v-else-if="data.item.name === 'saved'" @change="changeValue(data.item.name, $event)">
          <option value="true" :selected="data.item.value == 'true'">yes</option>
          <option value="false" :selected="data.item.value == 'false'">no</option>
        </select>
        <input v-else type="text" @change="changeValue(data.item.name, $event)" :value="data.item.value" style="width: 100%" />
      </template>
    </b-table>
  </div>
</template>

<script>
import * as idb from '../../../store/idb.js';
import Vue from 'vue';

export default {
  name: 'ProfileLink',
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
      fieldDefns: [
        { key: 'name', label: 'Name', sortable: true, class: 'col-name' },
        { key: 'value', label: 'Value', sortable: true, class: 'col-value' },
      ],
      filter: null,
      removePropertySelect: null,
      changesPending: false,
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    changeName(field, event) {
      let val = this.link[field];
      delete this.link[field];
      this.link[event.target.value] = val;
      this.changesPending = true;
    },
    changeValue(field, event) {
      this.link[field] = event.target.value;
      this.changesPending = true;
    },
    tryToAddProperty() {
      if (this.canAddProperty) {
        this.addProperty();
      }
    },
    addProperty() {
      Vue.set(this.link, this.filter, '');
      this.changesPending = true;
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
    deleteLink() {
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
          text: this.profileName + ' (' + this.profileId + ')',
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
