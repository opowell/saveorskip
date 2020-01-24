<template>
  <div style="display: flex; flex-direction: column; height: 100%">
    <b-modal id="addFilterModal" title="Add Filter" @ok="addFilter" no-fade>
      <div style="margin-bottom: 1rem;">
        <span style="width: 100px;">Field:</span>
        <select id="addFilterField">
          <option v-for="(fieldName, index) in fieldNames" :key="index" :value="fieldName.key" :selected="addFilterField === fieldName.key">
            {{ fieldName.label }}
          </option>
        </select>
      </div>
      <div style="margin-bottom: 1rem;">
        <span style="width: 100px;">Operator:</span>
        <select id="addFilterOperator">
          <option value="contains" selected>contains</option>
          <option value="eq">=</option>
          <option value="gt">&gt;</option>
          <option value="ge">&ge;</option>
          <option value="lt">&lt;</option>
          <option value="le">&le;</option>
          <option value="notc">does NOT contain</option>
          <option value="ne">&ne;</option>
        </select>
      </div>
      <div style="margin-bottom: 1rem;">
        <span style="width: 100px;">Value:</span>
        <input ontabindex="1" id="addFilterValue" type="text" v-on:keyup.enter="addFilter" />
      </div>
    </b-modal>
    <!-- User Interface controls -->
    <div style="display: flex; align-items: baseline; flex: 0 0 auto; padding: 1em; background-color: rgb(226, 226, 226);">
      <b-breadcrumb :items="crumbs" />
      <div style="display: flex;">
        <span class="filter" v-for="(filter, index) in filters" :key="index" @click="removeFilter(index)">
          <span style="color: green">{{ filterLabel(filter.field) }}</span>
          <span style="color: grey" v-html="filterSymbol(filter.operator)" />
          <span style="color: red">{{ filter.value }}</span>
        </span>
      </div>
      <div style="flex: 1 1 auto">&nbsp;</div>
      <div>
        <span v-show="hasSelection">
          <button @click="clearSelection" title="De-select all selected objects.">Clear selection</button>
          <button @click="deleteSelectedRows" title="Delete selected objects.">Delete {{ selection.length }}...</button>
        </span>
        <span v-show="!hasSelection">
          <slot name="header"></slot>
          <button v-if="showAddComputed" @click="addItemPrompt">Add...</button>
          <button @click="openFilter">Filter...</button>
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
    <!-- responsive='true' -->
    <!-- <div style="flex: 1 1 auto; align-items: flex-start;"> -->
    <b-table
      :sort-by="sortBy"
      :sort-desc="sortDesc"
      ref="table"
      :hover="hoverRows"
      show-empty
      :items="items"
      :fields="fieldNames"
      :filter="filters"
      :filter-function="filterFunction"
      @row-clicked="clickItem"
      class="mt-3"
      selectable
      @row-selected="rowSelected"
      no-select-on-click
      :thClass="thClass"
      no-border-collapse
      sticky-header
      :tbody-tr-class="isObjArray ? 'click-row' : ''"
      style="margin-left: 1em; margin-right: 0em; margin-top: 0rem !important; max-height: unset; flex: 1 1 auto; align-items: flex-start; align-self: flex-start; max-width: calc(100% - 1em); margin-bottom: 0px;"
    >
      <slot></slot>

      <template v-slot:head(__checkbox)="data">
        <input id="checkBoxHeader" type="checkbox" v-model="selectAll" @change="selectAllChange($event)" />
      </template>

      <template v-slot:head()="data">
        <span class="table-header" @click.prevent.stop="openFilter(data)">{{ data.label }}</span>
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
        <span v-if="isDate(data.value)" :title="data.value">{{ timeAgo(data.value) }}</span>
        <span v-else :title="data.value">{{ data.value }}</span>
      </template>
    </b-table>
  </div>
</template>

<script>
import Vue from 'vue';
import * as moment from 'moment';

export default {
  // eslint-disable-next-line prettier/prettier
  props: [
    'sortBy',
    'sortDesc',
    'object',
    'ineditableRowNames',
    'ineditableColNames',
    'store',
    'fetchData',
    'links',
    'rowNamesToSkip',
    'colNamesToSkip',
    'colLabels',
    'rowLabels',
    'rowDescriptions',
    'showAdd',
    'selectable',
    'thClass',
    'crumbs',
    'givenCols',
    'givenRows',
    'hoverProp',
  ],
  mounted() {
    let str = this.$route.query.filters;
    if (str == null) {
      return;
    }
    let filtersStrs = [str];
    if (str.includes(']]')) {
      filtersStrs = str.split(']]');
    }
    for (let i in filtersStrs) {
      let values = filtersStrs[i].split(',');
      if (values.length !== 3) {
        continue;
      }
      let filterObj = {
        field: values[0],
        operator: values[1],
        value: values[2],
      };
      this.filters.push(filterObj);
    }
  },
  data() {
    return {
      deleteItemSelect: null,
      changesPending: false,
      selectAll: false,
      selection: [],
      selectableProp: '',
      showColFilters: false,
      addFilterField: '',
      filters: [],
    };
  },
  methods: {
    clearSelection() {
      this.$refs.table.clearSelected();
      document.getElementById('checkBoxHeader').checked = false;
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
    filterSymbol(operator) {
      switch (operator) {
        case 'contains':
          return 'contains';
        case 'notC':
          return 'does NOT contain';
        case 'eq':
          return '=';
        case 'ne':
          return '&ne;';
        case 'gt':
          return '&gt;';
        case 'ge':
          return '&ge;';
        case 'lt':
          return '&lt;';
        case 'le':
          return '&le;';
      }
    },
    filterFunction(rowData, filters) {
      for (let i in filters) {
        let filter = filters[i];
        if (filter.field == null) {
          continue;
        }
        if (filter.value == null) {
          continue;
        }
        if (rowData[filter.field] == null) {
          return false;
        }
        let x = rowData[filter.field] + '';
        switch (filter.operator) {
          case 'contains':
            if (!x.includes(filter.value)) {
              return false;
            }
            break;
          case 'notC':
            if (x.includes(filter.value)) {
              return false;
            }
            break;
          case 'eq':
            if (x != filter.value) {
              return false;
            }
            break;
          case 'ne':
            if (x == filter.value) {
              return false;
            }
            break;
          case 'gt':
            if (x <= filter.value) {
              return false;
            }
            break;
          case 'ge':
            if (x < filter.value) {
              return false;
            }
            break;
          case 'lt':
            if (x >= filter.value) {
              return false;
            }
            break;
          case 'le':
            if (x > filter.value) {
              return false;
            }
            break;
        }
      }
      return true;
    },
    openFilter(data) {
      this.addFilterField = data.column;
      this.$bvModal.show('addFilterModal');
      Vue.nextTick(function() {
        document.getElementById('addFilterValue').focus();
      });
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
        for (let i in this.filters) {
          filtersStr += this.filters[i].field + ',' + this.filters[i].operator + ',' + this.filters[i].value + ']]';
        }
      }
      try {
        this.$router.push(path + filtersStr);
      } catch (err) {}
    },
    addFilter() {
      this.$bvModal.hide('addFilterModal');
      let filter = {
        field: document.getElementById('addFilterField').value,
        operator: document.getElementById('addFilterOperator').value,
        value: document.getElementById('addFilterValue').value,
      };
      this.filters.push(filter);
      this.updateFilterQuery();
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
      // console.log('selected ' + rows.length);
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
    timeAgo(obj) {
      return moment(obj).fromNow();
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
      this.fetchData();
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
        sortable: true,
      };
      return field;
    },
  },
  computed: {
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
    sortOptions() {
      // Create an options list from our fields
      return this.fields
        .filter(f => f.sortable)
        .map(f => {
          return { text: f.label, value: f.key };
        });
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
          sortable: true,
        });
        out.push({
          key: 'value',
          label: 'Value',
          class: 'table-cell',
          sortable: true,
        });
        out.push({
          key: 'description',
          label: 'Description',
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
          console.log(i);
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
.filter {
  background-color: #f7f7f7;
  border-radius: 3px;
  padding: 2px 6px;
  margin-left: 5px;
  color: #444;
  border: 1px solid #ddd;
}
.filter:hover {
  text-decoration-line: line-through;
  cursor: pointer;
  background-color: #ddd;
}
</style>

<style>
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
</style>
