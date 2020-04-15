<template>
  <div style="display: flex; flex-direction: column; height: 100%; background-color: #f8f8f8;">
    <!-- Edit Filters/Sort modal -->
    <b-modal id="editFiltersModal" title="Edit Filters / Sort" @ok="saveFilters" no-fade size="lg">
      <div style="margin-bottom: 1rem;">
        Results are sorted and filtered by the following fields, in the order that they appear in this list. Bounds are inclusive. Drag and drop to re-arrange order. See
        <a href="https://w3c.github.io/IndexedDB/#key-construct" target="_blank">W3C docs</a>.
      </div>
      <div
        v-for="(filter, index) in tempFilters"
        :key="index + filter.field"
        class="filterRow"
        :draggable="tempFilters.length > 1"
        @dragstart="handleDragStart($event, index)"
        @dragenter="modalHandleDragEnter($event, index)"
        @dragover="handleDragOver($event)"
      >
        <span>{{ filter.field }}: </span>
        <span>
          <input @dragstart.stop.prevent draggable="true" ontabindex="1" id="addFilterLowerValue" type="text" v-on:keyup.enter="saveFilters" v-model="filter.lowerValue" />
          -
          <input @dragstart.stop.prevent draggable="true" ontabindex="2" id="addFilterUpperValue" type="text" v-on:keyup.enter="saveFilters" v-model="filter.upperValue" />
        </span>
        <button @click="deleteFilter(index)" title="Delete this filter.">X</button>
      </div>
      <div class="mt-3" style="display: flex;">
        <span class="mr-2">Sort order:</span>
        <span>
          <div>
            <label for="increasing" style="display: flex; align-items: baseline">
              <input type="radio" id="increasing" value="increasing" class="mr-1" v-model="tempSortOrder" />
              Increasing
            </label>
          </div>
          <div>
            <label for="decreasing" style="display: flex; align-items: baseline">
              <input type="radio" id="decreasing" value="decreasing" class="mr-1" v-model="tempSortOrder" />
              Decreasing
            </label>
          </div>
        </span>
      </div>
      <hr />
      <div class="mt-3" style="display: flex; align-items: baseline;">
        <select id="addFilterField">
          <option v-for="(fieldName, index) in nonFilteredFieldNames" :key="index" :value="fieldName.key">
            {{ fieldName.label }}
          </option>
        </select>
        <button @click="addFilter" :disabled="nonFilteredFieldNames.length === 0">Add Filter</button>
      </div>
      <div>
        Load preset:
        <select v-model="selectedIndex">
          <option v-for="preset in indices" :key="displayIndex(preset)" :value="preset">
            {{ displayIndex(preset) }}
          </option>
        </select>
        <button @click="loadIndex" :disabled="indices.length === 0">Load</button>
      </div>
    </b-modal>
    <!-- User Interface controls -->
    <div style="display: flex; align-items: baseline; flex: 0 0 auto; padding: 1em; background-color: rgb(226, 226, 226);">
      <b-breadcrumb :items="crumbs" />
      <div class="query" @click="editFilters">
        <span
          class="filter"
          :class="{ filterMovable: tempFilters.length > 1 }"
          v-for="(filter, index) in filters"
          :key="index + ',' + filterToString(filter)"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragenter="handleDragEnter($event, index)"
          @drop="handleDrop($event)"
          @dragover="handleDragOver($event)"
        >
          <span style="color: green">{{ filterLabel(filter.field) }}</span>
          <span v-if="filter.lowerValue === '' && filter.upperValue === ''" />
          <span v-else-if="filter.lowerValue == null && filter.upperValue == null" />
          <span v-else-if="filter.lowerValue === 'undefined' && filter.upperValue === 'undefined'" />
          <span v-else-if="filter.lowerValue === filter.upperValue"
            ><span style="color: grey">=</span><span style="color: red"> {{ filter.upperValue }}</span>
          </span>
          <span v-else-if="filter.lowerValue == '' || filter.lowerValue === undefined"
            ><span style="color: grey">&le;</span><span style="color: red"> {{ filter.upperValue }}</span>
          </span>
          <span v-else-if="filter.upperValue == '' || filter.upperValue === undefined"
            ><span style="color: grey">&ge;</span><span style="color: red"> {{ filter.lowerValue }}</span>
          </span>
          <span v-else>
            <span style="color: red">{{ filter.lowerValue }}</span>
            <span style="color: grey"> - </span>
            <span style="color: red">{{ filter.upperValue }}</span>
          </span>
        </span>
        <span v-show="filters.length > 0" style="margin-left: 0.4rem; margin-right: 0.4rem; color: grey;" v-html="sortOrder === 'decreasing' ? '&#9660;' : '&#9650;'" />
      </div>
      <div style="flex: 1 1 auto">&nbsp;</div>
      <div>
        <span v-show="hasSelection">
          <button @click="clearSelection" title="De-select all selected objects.">Clear selection</button>
          <button @click="deleteSelectedRows" title="Delete selected objects.">Delete {{ selection.length }}...</button>
        </span>
        <span v-show="!hasSelection" style="display: flex; flex-wrap: wrap;">
          <slot name="header"></slot>
          <button v-if="showAddComputed" @click="addItemPrompt">{{ addItemText }}</button>
          <button @click="editFilters">Edit Filters...</button>
          <button v-if="!isObjArray" @click="duplicate">Duplicate</button>
          <button v-if="!isObjArray" @click="deleteObject" title="Delete this object.">Delete...</button>
          <button v-if="!isObjArray" title="Save the changes to this object." :disabled="!changesPending" :class="{ 'btn-primary': changesPending }" @click="saveObject">
            Save
          </button>
          <button v-if="!isObjArray" title="Reset this object to its original form" @click="reset" :disabled="!changesPending">Reset</button>
        </span>
      </div>
    </div>
    <!-- Main table element -->
    <b-table
      ref="table"
      :hover="hoverRows"
      show-empty
      :items="items"
      :fields="fieldNames"
      @row-clicked="clickItem"
      class="mt-3"
      selectable
      @row-selected="rowSelected"
      :per-page="perPage"
      :current-page="currentPage"
      no-select-on-click
      :thClass="thClass"
      no-border-collapse
      sticky-header
      :tbody-tr-class="isObjArray ? 'click-row' : ''"
      :busy="tableBusy"
      style="background-color: #fff; margin-left: 1em; margin-right: 0em; margin-top: 0rem !important; max-height: unset; flex: 1 1 auto; align-items: flex-start; align-self: flex-start; margin-bottom: 0px;"
    >
      <slot></slot>

      <template v-slot:table-busy>
        <div class="my-2">
          <b-spinner></b-spinner>
        </div>
      </template>

      <template v-slot:head(__checkbox)>
        <input id="checkBoxHeader" type="checkbox" v-model="selectAll" @change="selectAllChange($event)" />
      </template>

      <template v-slot:head()="data">
        <span class="table-header" @click.prevent.stop="editFilters(data)">{{ data.label }}</span>
      </template>

      <template v-slot:cell(__checkbox)="data">
        <input v-if="isSelectable(data.item)" type="checkbox" :checked="isSelected(data)" @change="toggleRowSelect(data, $event)" />
        <div v-else></div>
      </template>

      <template v-slot:cell(name)="data">
        <a v-if="isLink(data.value)" :title="data.value" :href="links[data.value]">
          {{ tryDecodeURIComponent(rowLabel(data.value)) }}
        </a>
        <div v-else-if="!canEditCell('name', data.item)" :title="data.value">
          {{ tryDecodeURIComponent(rowLabel(data.value)) }}
        </div>
        <b-input v-else type="text" @change="changeFieldName(data.item.name, $event)" @keyup="changeFieldName(data.item.name, $event)" :value="data.value" style="width: 100%" />
      </template>

      <template v-slot:cell(value)="data">
        <div v-if="!canEditCell('value', data.item)" :title="data.value">
          {{ tryDecodeURIComponent(data.value) }}
        </div>
        <b-select
          v-else-if="typeof data.item.value === 'boolean'"
          @change="changeFieldValue(data.item.name, $event, data.item)"
          @keyup="changeFieldValue(data.item.name, $event, data.item)"
          @input="changeFieldValue(data.item.name, $event, data.item)"
          :value="data.item.value"
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
          :value="tryDecodeURIComponent(data.value)"
        />
        <textarea
          v-else
          class="form-control"
          @keyup="changeFieldValue(data.item.name, $event)"
          @change="changeFieldValue(data.item.name, $event)"
          :value="tryDecodeURIComponent(data.value)"
          style="width: 100%"
        />
      </template>

      <template v-slot:cell(description)="data">
        <span style="white-space: normal;" :title="data.value">{{ data.value }}</span>
      </template>

      <template v-slot:cell()="data">
        <objects-table-cell :value="data.value" />
      </template>
    </b-table>
    <div style="display: flex; padding: 1rem; background-color: rgb(226, 226, 226); width: 100%; align-items: baseline;">
      <b-pagination v-model="currentPage" :total-rows="numRows" :per-page="perPage" aria-controls="my-table" style="margin: 0px;" @change="pageChanged" />
      <span style="flex: 1 1 auto; margin-left: 1em;"> {{ 1 + (currentPage - 1) * perPage }} - {{ Math.min(currentPage * perPage, numRows) }} / {{ numRows }} </span>
      <span>
        <select v-model="perPage">
          <option value="50">50</option>
          <option value="200">200</option>
          <option value="1000">1000</option>
        </select>
        <span>entries per page</span>
      </span>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import ObjectsTableCell from './ObjectsTableCell.vue';
import * as idb from '../../../store/idb.ts';

export default {
  components: {
    ObjectsTableCell,
  },
  props: {
    addItemText: String,
    colLabels: Object,
    colNamesToSkip: Array,
    displayIndexFn: Function,
    crumbs: Array,
    fetchRows: Function,
    fetchInitialData: Function,
    givenCols: Array,
    givenRows: Array,
    hoverProp: Boolean,
    ineditableRowNames: {
      default: () => {
        return [];
      },
      type: Array,
    },
    ineditableColNames: Array,
    links: Object,
    numResults: Number,
    object: {
      default: () => {
        return [];
      },
      type: [Object, Array],
    },
    rowDescriptions: Object,
    rowLabels: Object,
    rowNamesToSkip: Array,
    selectable: Boolean,
    showAdd: {
      default: true,
      type: Boolean,
    },
    storeNames: Array,
    thClass: String,
    totalRows: Number,
  },
  watch: {
    currentPage: async function() {
      await this.checkIfNeedData();
    },
    sortOrder: async function() {
      this.updateFilterQuery();
    },
    $route() {
      this.callFetchData();
    },
  },
  async mounted() {
    let str = this.$route.query.filters;
    let skipFilters = false;
    if (str == null) {
      skipFilters = true;
    }
    if (!skipFilters) {
      let filtersStrs = [str];
      if (str.includes(']]')) {
        filtersStrs = str.split(']]');
      }
      for (let i in filtersStrs) {
        let filterObj = this.stringToFilter(filtersStrs[i]);
        if (filterObj === null) {
          continue;
        }
        this.filters.push(filterObj);
      }
    }
    let sortStr = this.$route.query.sort;
    if (sortStr === 'decr') {
      this.sortOrder = 'decreasing';
    } else {
      this.sortOrder = 'increasing';
    }

    this.currentPage = 1;
    await this.callFetchData();
    await this.fetchIndices();
  },
  data() {
    return {
      deleteItemSelect: null,
      changesPending: false,
      selectAll: false,
      selection: [],
      selectableProp: '',
      showColFilters: false,
      filters: [],
      perPage: 50,
      currentPage: 1,
      status: 'Ready',
      tableBusy: false,
      curDragFilterIndex: -1,
      redrawAfterDrop: false,
      tempFilters: [],
      indices: [],
      selectedIndex: null,
      sortOrder: 'increasing',
      tempSortOrder: 'increasing',
    };
  },
  methods: {
    loadIndex() {
      this.tempFilters.splice(0, this.tempFilters.length);
      for (let i in this.selectedIndex.tokens) {
        this.tempFilters.push({
          field: this.selectedIndex.tokens[i],
        });
      }
    },
    displayIndex(index) {
      if (this.displayIndexFn != null) {
        return this.displayIndexFn(index);
      }
      return index.keyPath;
    },
    async fetchIndices() {
      if (this.storeNames != null) {
        this.indices.splice(0, this.indices.length);
        this.indices = await idb.getIndices({ offset: 0, numRows: 100, storeNames: this.storeNames });
        for (let i = 0; i < this.indices.length; i++) {
          let index = this.indices[i];
          index.tokens = index.keyPath.split('_');
        }
      }
    },
    stringToFilter(string) {
      let tokens = string.split(',');
      if (tokens.length !== 3) {
        return null;
      }
      let lowerValue = tokens[0];
      if (lowerValue !== '' && !isNaN(+lowerValue)) {
        lowerValue = +lowerValue;
      }
      let upperValue = tokens[2];
      if (upperValue !== '' && !isNaN(+upperValue)) {
        upperValue = +upperValue;
      }
      let filterObj = {
        lowerValue,
        field: tokens[1],
        upperValue,
      };
      return filterObj;
    },
    filterToString(filter) {
      let out = '';
      out += (filter.lowerValue == null ? '' : filter.lowerValue) + ',';
      out += filter.field;
      out += ',' + (filter.upperValue == null ? '' : filter.upperValue);
      return out;
    },
    handleDragEnter(e, index) {
      if (e.target.getAttribute('draggable') !== 'true') {
        return;
      }
      if (e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop.
      }
      e.dataTransfer.dropEffect = 'move'; // See the section on the DataTransfer object.
      if (this.curDragFilterIndex !== index) {
        let filter = this.filters.splice(this.curDragFilterIndex, 1)[0];
        this.filters.splice(index, 0, filter);
        this.redrawAfterDrop = true;
        this.curDragFilterIndex = index;
      }
      return false;
    },
    handleDragStart(ev, filterIndex) {
      this.curDragFilterIndex = filterIndex;
    },
    handleDrop(e) {
      if (this.redrawAfterDrop) {
        this.redrawAfterDrop = false;
        this.updateFilterQuery();
      }
    },
    handleDragOver(e) {
      e.preventDefault();
    },
    modalHandleDragEnter(e, index) {
      if (e.target.getAttribute('draggable') !== 'true') {
        return;
      }
      if (e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop.
      }
      e.dataTransfer.dropEffect = 'move'; // See the section on the DataTransfer object.
      if (this.curDragFilterIndex !== index) {
        let filter = this.tempFilters.splice(this.curDragFilterIndex, 1)[0];
        this.tempFilters.splice(index, 0, filter);
        this.redrawAfterDrop = true;
        this.curDragFilterIndex = index;
      }
      return false;
    },
    async callFetchData() {
      this.items.splice(0, this.items.length);
      this.status = 'Loading...';
      if (this.fetchInitialData) {
        this.tableBusy = true;
        await this.fetchInitialData();
        this.tableBusy = false;
      }
      await this.checkIfNeedData();
      this.status = 'Finished loading';
    },
    clearSelection() {
      this.$refs.table.clearSelected();
      document.getElementById('checkBoxHeader').checked = false;
    },
    async checkIfNeedData() {
      if (this.items.length < this.numResults && this.items.length < this.perPage * (this.currentPage - 1) + 1) {
        if (!this.fetchRows) {
          return;
        }
        let newItems = await this.fetchRows();
        this.items.push(...newItems);
        this.$refs.table.refresh();
        if (newItems.length > 0) {
          this.$nextTick(async function() {
            this.checkIfNeedData();
          });
        }
      }
    },
    tryDecodeURIComponent(text) {
      try {
        let x = decodeURIComponent(text);
        return x;
      } catch (err) {
        console.log('error converting ' + text);
        return text;
      }
    },
    filterLabel(key) {
      for (let i in this.fieldNames) {
        let field = this.fieldNames[i];
        if (field.key === key) {
          return field.label;
        }
      }
      return key;
    },
    editFilters(data) {
      this.tempFilters.splice(0, this.tempFilters.length);
      let addFilter = data != null && data.column != null;
      for (let i in this.filters) {
        let filterCopy = {};
        filterCopy.field = this.filters[i].field;
        filterCopy.lowerValue = this.filters[i].lowerValue;
        filterCopy.upperValue = this.filters[i].upperValue;
        this.tempFilters.push(filterCopy);
        if (addFilter && filterCopy.field === data.column) {
          addFilter = false;
        }
      }
      if (addFilter) {
        let newFilter = {
          field: data.column,
        };
        this.tempFilters.push(newFilter);
      }

      this.tempSortOrder = this.sortOrder;

      this.$bvModal.show('editFiltersModal');
    },
    addBlankFilter() {
      let newFilter = {
        field: this.nonFilteredFieldNames[0].key,
      };
      this.tempFilters.push(newFilter);
    },
    updateFilterQuery() {
      let path = window.location.hash;
      if (path.length > 2) {
        path = path.substring(2);
      }
      if (path.includes('/')) {
        let slashParts = path.split('/');
        path = slashParts[slashParts.length - 1];
      }
      if (path.includes('?')) {
        path = path.split('?')[0];
      }
      let filtersStr = '';
      if (this.filters.length > 0) {
        filtersStr = '?filters=';
        let filterStrs = [];
        for (let i in this.filters) {
          filterStrs.push(this.filterToString(this.filters[i]));
        }
        filtersStr += filterStrs.join(']]');
      }
      let sortStr = '';
      if (filtersStr.length > 0 && this.sortOrder === 'decreasing') {
        sortStr = '&sort=decr';
      }
      let newPath = path + filtersStr + sortStr;
      if (encodeURI('/' + newPath) !== this.$router.currentRoute.fullPath) {
        try {
          this.$router.push(newPath);
        } catch (err) {}
      }
      this.currentPage = 1;
    },
    saveFilters() {
      this.$bvModal.hide('editFiltersModal');
      this.filters.splice(0, this.filters.length);
      this.filters.push(...this.tempFilters);
      this.sortOrder = this.tempSortOrder;
      this.updateFilterQuery();
    },
    deleteFilter(index) {
      this.tempFilters.splice(index, 1);
    },
    addFilter() {
      let filter = {
        field: document.getElementById('addFilterField').value,
      };
      this.tempFilters.push(filter);
    },
    pageChanged(event) {
      this.$emit('pageChanged', event);
    },
    selectAllChange(event) {
      if (event.target.checked) {
        for (let i = 0; i < this.items.length; i++) {
          if (this.isSelectable(this.items[i])) {
            this.$refs.table.selectRow(i);
          }
        }
      } else {
        this.$refs.table.clearSelected();
      }
    },
    deleteSelectedRows() {
      if (this.selection.length === 0) {
        return;
      }
      if (this.isObjArray) {
        this.$emit('deleteSelectedRows', this.selection);
      } else {
        for (let i in this.selection) {
          let field = this.selection[i];
          Vue.delete(this.object, field.name);
        }
        this.changesPending = true;
        this.clearSelection();
      }
    },
    removeFilter(index) {
      this.filters.splice(index, 1);
      this.updateFilterQuery();
    },
    toggleRowSelect(data, event) {
      let index = data.index;
      if (event.target.checked) {
        this.$refs.table.selectRow(index);
        this.selectableProp = 'range';
      } else {
        this.$refs.table.unselectRow(index);
      }
    },
    rowSelected(rows) {
      this.selection = rows;
    },
    isSelected(data) {
      for (let i in this.selection) {
        if (this.selection[i] === data.item) {
          return true;
        }
      }
      return false;
    },
    isSelectable(item) {
      if (this.isObjArray) {
        return true;
      } else {
        if (this.isLink(item.name)) {
          return false;
        } else {
          return this.canEditCell('name', item);
        }
      }
    },
    rowLabel(x) {
      if (this.rowLabels != null && this.rowLabels[x] != null) {
        return this.rowLabels[x];
      }
      return x;
    },
    rowDescription(x) {
      if (this.rowDescriptions != null && this.rowDescriptions[x] != null) {
        return this.rowDescriptions[x];
      }
      return '';
    },
    isLink(propertyName) {
      if (this.links == null) {
        return false;
      }
      return this.links[propertyName] != null;
    },
    isDate(obj) {
      return obj instanceof Date;
    },
    changeFieldName(field, value) {
      if (value.target != null) {
        value = value.target.value;
      }
      if (this.ineditableRowNames.includes(value)) {
        return;
      }
      let val = this.object[field];
      Vue.delete(this.object, field);
      this.changesPending = true;
      if (value !== '') {
        this.object[value] = val;
      }
    },
    changeFieldValue(field, value, item) {
      if (value.target != null) {
        value = value.target.value;
      }
      if (this.ineditableColNames.includes(field)) {
        return;
      }
      if (value === 'true') {
        value = true;
      }
      if (value === 'false') {
        value = false;
      }
      if (this.object[field] === value) {
        return;
      }
      Vue.set(this.object, field, value);
      if (item != null) {
        item.value = value;
      }
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
      this.callFetchData();
      this.changesPending = false;
    },
    addItem() {
      let fieldName = 'field';
      let i = 1;
      while (true) {
        if (this.object[fieldName + i] == null) {
          break;
        }
        i++;
      }
      fieldName = fieldName + i;
      Vue.set(this.object, fieldName, '');
      this.changesPending = true;
    },
    deleteItem() {
      if (this.deleteItemSelect == null) {
        return;
      }
      Vue.delete(this.object, this.deleteItemSelect);
      this.changesPending = true;
    },
    addItemPrompt() {
      if (this.isObjArray) {
        this.$emit('create');
      } else {
        this.addItem();
      }
    },
    clickItem(item, index, event) {
      if (this.hasSelection) {
        if (this.$refs.table.isRowSelected(index)) {
          this.$refs.table.unselectRow(index);
        } else {
          this.$refs.table.selectRow(index);
        }
      } else {
        this.$emit('click', { item, index, event });
      }
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
    getField(key) {
      let label = key;
      if (this.colLabels != null && this.colLabels[key] != null) {
        label = this.colLabels[key];
      }
      let field = {
        key,
        label,
        class: 'table-cell',
        sortable: false,
      };
      return field;
    },
  },
  computed: {
    numRows() {
      if (this.numResults == null) {
        return this.items.length;
      }
      return this.numResults;
    },
    hoverRows() {
      if (this.hoverProp == null) {
        return this.isObjArray;
      } else {
        return this.hover;
      }
    },
    selectableComputed() {
      if (this.selectable === false) {
        return false;
      }
      return true;
    },
    showAddComputed() {
      if (this.showAdd === false) {
        return false;
      }
      return true;
    },
    hasSelection() {
      return this.selection.length > 0;
    },
    selectedRows() {
      let out = [];
      let tableRows = this.$refs.table.selectedRows;
      for (let i in tableRows) {
        if (tableRows[i]) {
          out.push(i);
        }
      }
      return out;
    },
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
    fieldNames() {
      let checkBoxField = {
        key: '__checkbox',
        label: '',
        sortable: false,
      };
      let out = [];
      if (this.selectableComputed) {
        out.push(checkBoxField);
      }
      if (Array.isArray(this.givenCols)) {
        for (let i in this.givenCols) {
          let field = this.getField(this.givenCols[i]);
          out.push(field);
        }
      }
      if (Array.isArray(this.object)) {
        for (let i in this.object) {
          let item = this.object[i];
          nextItem: for (let a in item) {
            if (this.colNamesToSkip != null && this.colNamesToSkip.includes(a)) {
              continue;
            }
            for (let j in out) {
              if (out[j].key === a) {
                continue nextItem;
              }
            }
            let field = this.getField(a);
            out.push(field);
          }
        }
      } else {
        out.push({
          key: 'name',
          label: 'Name',
          class: ['table-cell', 'narrow'],
          sortable: false,
        });
        out.push({
          key: 'value',
          label: 'Value',
          class: 'table-cell',
          sortable: false,
        });
        out.push({
          key: 'description',
          label: 'Description',
          class: 'table-cell',
          sortable: false,
        });
      }
      return out;
    },
    nonFilteredFieldNames() {
      let out = [];
      for (let i in this.fieldNames) {
        let alreadyFiltered = false;
        for (let j in this.tempFilters) {
          if (this.tempFilters[j].field === this.fieldNames[i].key) {
            alreadyFiltered = true;
            break;
          }
        }
        if (!alreadyFiltered) {
          out.push(this.fieldNames[i]);
        }
      }
      return out;
    },
    items() {
      let out = [];

      if (this.object == null) {
        return out;
      }

      if (Array.isArray(this.object)) {
        for (let i in this.object) {
          out.push(this.object[i]);
        }
      } else {
        if (Array.isArray(this.givenRows)) {
          for (let i in this.givenRows) {
            let row = this.givenRows[i];
            out.push({
              name: this.valueToString(row),
              value: this.valueToString(this.object[row]),
              description: this.rowDescription(row),
            });
          }
        }
        for (let i in this.object) {
          // console.log(i);
          let exists = false;
          for (let j in out) {
            if (out[j].name === this.valueToString(i)) {
              exists = true;
              break;
            }
          }
          if (exists) {
            continue;
          }
          if (this.rowNamesToSkip != null && this.rowNamesToSkip.includes(this.valueToString(i))) {
            continue;
          }
          out.push({
            name: this.valueToString(i),
            value: this.valueToString(this.object[i]),
            description: this.rowDescription(i),
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
.filterRow {
  padding: 5px 2px;
}

.filterRow:hover {
  background-color: #ddd;
}

.query {
  margin-left: 0.4rem;
  border-radius: 2px;
  background-color: #f7f7f7;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
}

.query:hover {
  background-color: #fff;
  border-color: #888;
  cursor: pointer;
}

.filter {
  padding: 2px 6px;
  color: #444;
}
.filterMovable:hover {
  cursor: move;
  text-decoration: underline;
}
.table-cell {
  vertical-align: baseline !important;
  max-width: 40rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
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

th {
  border-top: 0px !important;
}

.table-header {
  padding: 2px 5px;
  border-radius: 2px;
}
.table-header:hover {
  background-color: rgba(118, 200, 255, 0.308);
  cursor: pointer;
}

button {
  flex: 0 0 auto;
  margin-bottom: 0.25rem !important;
}

.breadcrumb-item {
  word-break: break-all;
}

.click-row {
  cursor: pointer;
}

.breadcrumb {
  margin-bottom: 0em !important;
}

button {
  margin-bottom: 0px !important;
}

.click-row:hover {
  background-color: rgba(121, 200, 239, 0.34) !important;
}

.over {
  border-left: 2px solid blue;
}
</style>
