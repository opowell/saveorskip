<template>
  <div>
    <!-- User Interface controls -->
    <div style="display: flex; align-items: baseline;">
      <b-input v-model="filter" placeholder="Add / filter" v-on:keyup.enter="tryToAddItem" style="max-width: 400px;" />
      <button :disabled="!canAddItem" @click="addItem">Add</button>
      <div style="flex: 1 1 auto">&nbsp;</div>
      <slot name="header"></slot>
      <button v-if="!isObjArray" @click="duplicate">Duplicate</button>
      <button v-if="!isObjArray" @click="deleteObject" title="Delete this object.">Delete...</button>
      <button v-if="!isObjArray" title="Save the changes to this object." :disabled="!changesPending" :class="{ 'btn-primary': changesPending }" @click="saveObject">Save</button>
      <button v-if="!isObjArray" title="Reset this object to its original form" @click="reset" :disabled="!changesPending">Reset</button>
    </div>
    <!-- Main table element -->
    <b-table :hover="isObjArray" show-empty stacked="md" :items="items" :fields="fieldNames" :filter="filter" @row-clicked="clickItem" class="mt-3">
      <template v-slot:cell(name)="data">
        <a v-if="isLink(data.value)" :title="data.value" :href="links[data.value]">
          {{ decodeURIComponent(data.value) }}
        </a>
        <div v-else-if="!canEditCell('name', data.item)" :title="data.value">
          {{ decodeURIComponent(data.value) }}
        </div>
        <b-input v-else type="text" @change="changeFieldName(data.item.name, $event)" @keyup="changeFieldName(data.item.name, $event)" :value="data.value" style="width: 100%" />
      </template>
      <template v-slot:cell(value)="data">
        <div v-if="!canEditCell('value', data.item)" :title="data.value">
          {{ decodeURIComponent(data.value) }}
        </div>
        <b-select
          v-else-if="typeof data.item.value === 'boolean'"
          @change="changeValue(data.item.name, $event)"
          @keyup="changeValue(data.item.name, $event)"
          v-model="data.item.value"
          style="width: unset;"
        >
          <option value="true">yes</option>
          <option value="false">no</option>
        </b-select>
        <b-input
          v-else-if="data.value.length === undefined || data.value.length < 80"
          class="form-control"
          style="width: 25rem;"
          type="text"
          @keyup="changeFieldValue(data.item.name, $event)"
          @change="changeFieldValue(data.item.name, $event)"
          :value="decodeURIComponent(data.value)"
        />
        <textarea
          v-else
          class="form-control"
          @keyup="changeFieldValue(data.item.name, $event)"
          @change="changeFieldValue(data.item.name, $event)"
          :value="decodeURIComponent(data.value)"
          style="width: 100%"
        />
      </template>
    </b-table>
  </div>
</template>

<script>
import * as idb from '../../../store/idb.js';
import Vue from 'vue';

export default {
  // eslint-disable-next-line prettier/prettier
  props: ['object', 'ineditableRowNames', 'ineditableColNames', 'store', 'fetchData', 'links', 'rowNamesToSkip', 'colNamesToSkip'],
  data() {
    return {
      sortDesc: true,
      filter: null,
      deleteItemSelect: null,
      changesPending: false,
    };
  },
  methods: {
    isLink(propertyName) {
      if (this.links == null) {
        return false;
      }
      return this.links[propertyName] != null;
    },
    changeFieldName(field, value) {
      if (value.target != null) {
        value = value.target.value;
      }
      if (this.ineditableRowNames.includes(value)) {
        return;
      }
      let val = this.object[field];
      delete this.object[field];
      this.changesPending = true;
      if (value !== '') {
        this.object[value] = val;
      }
    },
    changeFieldValue(field, value) {
      if (value.target != null) {
        value = value.target.value;
      }
      if (this.ineditableColNames.includes(field)) {
        return;
      }
      Vue.set(this.object, field, value);
      this.changesPending = true;
    },
    valueToString(val) {
      if (val == null) {
        return '';
      }
      if (typeof val === 'object') {
        return JSON.stringify(val);
      }
      return val;
    },
    duplicate() {},
    deleteObject() {
      this.$emit('deleteObject');
    },
    saveObject() {
      this.$emit('save');
      this.changesPending = false;
    },
    reset() {
      this.filter = '';
      this.fetchData();
      this.changesPending = false;
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
      this.$emit('create', inputString);
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
            if (this.colNamesToSkip != null && this.colNamesToSkip.includes(a)) {
              continue;
            }
            if (!out.includes(a)) {
              let field = {
                key: a,
                label: a,
                class: 'table-cell',
                sortable: true,
              };
              out.push(field);
            }
          }
        }
      } else {
        out.push({
          key: 'name',
          label: 'Name',
          class: ['table-cell', 'narrow'],
          sortable: true,
        });
        out.push({
          key: 'value',
          label: 'Value',
          class: 'table-cell',
          sortable: true,
        });
      }
      return out;
    },
    // removableItems() {
    //   let out = [];
    //   for (let i in this.items) {
    //     let keyField = this.items[i][this.itemKeyField];
    //     if (this.ineditableRowNames.includes(keyField)) {
    //       continue;
    //     }
    //     out.push({
    //       key: keyField,
    //       name: this.items[i][this.itemNameField],
    //     });
    //   }
    //   return out;
    // },
    items() {
      let out = [];
      if (Array.isArray(this.object)) {
        for (let i in this.object) {
          out.push(this.object[i]);
        }
      } else {
        for (let i in this.object) {
          if (this.rowNamesToSkip != null && this.rowNamesToSkip.includes(this.valueToString(i))) {
            continue;
          }
          out.push({
            name: this.valueToString(i),
            value: this.valueToString(this.object[i]),
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
.input-group-append {
  align-items: baseline;
}
</style>

<style>
.table-cell {
  vertical-align: baseline !important;
  max-width: 40rem;
}
.narrow {
  width: 10rem;
}
.cursor-pointer {
  cursor: pointer;
}
.table-cell > div {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
