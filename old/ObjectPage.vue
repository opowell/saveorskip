<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <div>
      <button @click="exportProfile">export</button>
      <button @click="duplicateProfile">duplicate</button>
      <button @click="deleteObject">delete</button>
      <button :class="{ 'btn-primary': changesPending }" @click="saveObject">save</button>
      <button :class="{ 'btn-primary': changesPending }" @click="reset">reset</button>
      <button :disabled="removePropertySelect == null" @click="removeProperty">remove property</button>
      <select v-model="removePropertySelect">
        <option v-for="fieldName in removableFieldNames" :key="fieldName" :value="fieldName">
          {{ fieldName }}
        </option>
      </select>
    </div>
    <ol>
      <li>
        <router-link :to="{ name: 'profileLinks', params: { id: profileId } }">links ({{ numLinks }})</router-link>
      </li>
      <li>
        <router-link :to="{ name: 'profileSources', params: { id: profileId } }">sources ({{ numSources }})</router-link>
      </li>
    </ol>
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
        <div v-if="data.item.name === 'id'">{{ data.item.name }}</div>
        <div v-else-if="'name' === data.item.name">{{ data.item.name }}</div>
        <input v-else type="text" @change="changeFieldName(data.item.name, $event)" :value="data.item.name" style="width: 100%;" />
      </template>
      <template v-slot:cell(value)="data">
        <div v-if="data.item.name === 'id'">
          {{ data.item.value }}
        </div>
        <input v-else type="text" @change="changeFieldValue(data.item.name, $event)" :value="data.item.value" style="width: 100%" />
      </template>
    </b-table>
  </div>
</template>

<script>
import * as idb from '../../../store/idb.js';
import { STORE_PROFILES } from '../../../store/Constants.ts';
import Vue from 'vue';

export default {
  name: 'ProfilePage',
  components: {},
  watch: {
    '$route.params.id': function(id) {
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
    changeFieldName(field, event) {
      let val = this.object[field];
      delete this.object[field];
      this.object[event.target.value] = val;
      this.changesPending = true;
    },
    changeFieldValue(field, event) {
      this.object[field] = event.target.value;
      this.changesPending = true;
    },
    tryToAddProperty() {
      if (this.canAddProperty) {
        this.addProperty();
      }
    },
    addProperty() {
      Vue.set(this.profile, this.filter, '');
      this.changesPending = true;
    },
    removeProperty() {
      if (this.removePropertySelect == null) {
        return;
      }
      Vue.delete(this.profile, this.removePropertySelect);
      this.changesPending = true;
    },
    saveObject() {
      idb.deleteProfile({
        profileId: this.$route.params.id,
      });
      idb.saveObject(STORE_PROFILES, this.profile);
      this.fetchData();
    },
    deleteObject: function() {
      idb.deleteProfile({
        profileId: this.$route.params.id,
      });
      this.$router.push({ name: 'profiles' });
    },

    fetchData() {
      idb.loadProfile({
        profileId: this.$route.params.id,
      });
      this.changesPending = false;
    },

    duplicateProfile: function() {
      this.$store.dispatch('duplicateProfile', {
        profileId: this.$route.params.id,
      });
      this.$router.push(this.$store.state.profileDuplicate.name);
    },
    reset() {
      this.filter = '';
      this.fetchData();
    },
  },
  computed: {
    canAddProperty() {
      return this.filter != null && this.filter.length > 0 && (this.profile == null || this.profile[this.filter] == null);
    },
    profileId() {
      return this.profile == null ? '' : this.profile.id;
    },
    profile() {
      return this.$store.state.profile;
    },
    profileName() {
      return this.profile == null ? '' : this.profile.name;
    },
    profileStats() {
      return this.$store.state.profileStats;
    },
    numLinks: function() {
      if (this.profileStats == null) {
        return 0;
      }
      return this.profileStats.numLinks;
    },
    numSources: function() {
      if (this.profileStats == null) {
        return 0;
      }
      return this.profileStats.numSources;
    },
    fields() {
      let out = [];
      for (let i = 0; i < this.fieldNames.length; i++) {
        let fieldName = this.fieldNames[i];
        out.push({
          name: fieldName,
          value: this.profile[fieldName],
        });
      }
      return out;
    },
    removableFieldNames() {
      let out = [];
      for (let i in this.fieldNames) {
        let fieldName = this.fieldNames[i];
        if (!['id', 'name'].includes(fieldName)) {
          out.push(fieldName);
        }
      }
      return out;
    },
    fieldNames() {
      let out = [];
      for (let a in this.profile) {
        out.push(a);
      }
      return out;
    },
    crumbs: function() {
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
      ];
    },
  },
};
</script>

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
