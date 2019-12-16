<template>
  <div>
    <!-- User Interface controls -->
    <div style="display: flex">
      <b-input-group v-if="!isObjArray">
        <b-btn @click="duplicate">duplicate</b-btn>
        <b-btn @click="deleteObject">delete</b-btn>
        <b-btn :class="{ 'btn-primary': changesPending }" @click="saveObject">save</b-btn>
        <b-btn :class="{ 'btn-primary': changesPending }" @click="reset">reset</b-btn>
      </b-input-group>
      <b-input-group class="mr-3">
        <b-form-input v-model="filter" placeholder="Add / filter" v-on:keyup.enter="tryToAddItem" />
        <b-input-group-append>
          <b-btn variant="primary" :disabled="!canAddItem" @click="addItem">Add</b-btn>
        </b-input-group-append>
      </b-input-group>
      <b-input-group class="ml-3" style="justify-content: flex-end;">
        <b-select value-field="key" text-field="name" :options="removableItems" v-model="deleteItemSelect" />
        <b-input-group-append>
          <b-btn :disabled="deleteItemSelect == null" @click="deleteItem">Delete...</b-btn>
        </b-input-group-append>
      </b-input-group>
    </div>
    <!-- Main table element -->
    <b-table hover show-empty stacked="md" :items="items" :fields="fieldNames" :filter="filter" @row-clicked="clickItem">
      <template v-slot:cell(name)="data">
        <div v-if="!canEditCell('name', data.item)">
          {{ data.value }}
        </div>
        <input v-else type="text" @change="changeFieldValue(data.value, $event)" :value="data.value" style="width: 100%" />
      </template>
      <template v-slot:cell(value)="data">
        <div v-if="!canEditCell('value', data.item)">
          {{ data.value }}
        </div>
        <input v-else type="text" @change="changeFieldValue(data.value, $event)" :value="data.value" style="width: 100%" />
      </template>
    </b-table>
  </div>
</template>

<script>
import * as idb from '../../../store/idb.js';
import Vue from 'vue';

export default {
  props: ['object', 'ineditableRowNames', 'ineditableColNames', 'store', 'fetchData'],
  data() {
    return {
      sortDesc: true,
      filter: null,
      deleteItemSelect: null,
      changesPending: false,
    };
  },
  methods: {
    duplicate() {},
    deleteObject() {},
    saveObject() {
      this.$emit('save');
    },
    reset() {
      this.filter = '';
      this.fetchData();
    },
    tryToAddItem() {
      if (this.canAddItem) {
        this.addItem();
      }
    },
    addItem() {
      if (Array.isArray(this.object)) {
        this.createNewItem(this.filter);
      } else {
        Vue.set(this.object, this.filter, '');
      }
      this.changesPending = true;
    },
    deleteItem() {
      if (this.deleteItemSelect == null) {
        return;
      }
      Vue.delete(this.object, this.deleteItemSelect);
      this.changesPending = true;
    },
    clickItem(item, index, event) {
      this.$emit('click', { item, index, event });
    },
    createNewItem(inputString) {
      this.$emit('create', { profileId: inputString });
    },
    canEditCell(field, obj) {
      if (this.isObjArray) {
        return false;
      }
      if (field === 'name') {
        if (this.editableFieldNames.includes(obj.name)) {
          return true;
        } else {
          return false;
        }
      }
      if (field === 'value') {
        if (this.editableFieldValues.includes(obj.name)) {
          return true;
        } else {
          return false;
        }
      }
      return false;
    },
  },
  computed: {
    editableFieldNames() {
      let out = [];
      if (Array.isArray(this.object)) {
      } else {
        for (let i in this.items) {
          let name = this.items[i].name;
          if (!out.includes(name) && !this.ineditableRowNames.includes(name)) {
            out.push(name);
          }
        }
      }
      return out;
    },
    editableFieldValues() {
      let out = [];
      if (Array.isArray(this.object)) {
      } else {
        for (let i in this.items) {
          let name = this.items[i].name;
          if (!out.includes(name) && !this.ineditableColNames.includes(name)) {
            out.push(name);
          }
        }
      }
      return out;
    },
    canAddItem() {
      return this.filter != null && this.filter.length > 0 && (this.object == null || this.object[this.filter] == null);
    },
    sortOptions() {
      // Create an options list from our fields
      return this.fields
        .filter(f => f.sortable)
        .map(f => {
          return { text: f.label, value: f.key };
        });
    },
    fieldNames() {
      let out = [];
      if (Array.isArray(this.object)) {
        for (let i in this.object) {
          let item = this.object[i];
          for (let a in item) {
            if (!out.includes(a)) {
              out.push(a);
            }
          }
        }
      } else {
        out.push('name');
        out.push('value');
      }
      return out;
    },
    removableItems() {
      let out = [];
      for (let i in this.object) {
        out.push({
          key: this.object[i].id,
          name: this.object[i].name,
        });
      }
      return out;
    },
    items() {
      let out = [];
      if (Array.isArray(this.object)) {
        for (let i in this.object) {
          out.push(this.object[i]);
        }
      } else {
        for (let i in this.object) {
          out.push({
            name: i,
            value: this.object[i],
          });
        }
      }
      return out;
    },
    isObjArray() {
      return Array.isArray(this.object);
    },
  },
};
</script>
<style scoped>
.nowrap > div {
  overflow-wrap: break-word;
  max-width: 300px;
}
</style>
