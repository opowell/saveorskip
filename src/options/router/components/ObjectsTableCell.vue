<template>
  <span :title="value">{{ formattedValue }}</span>
</template>

<script>
import * as moment from 'moment';

export default {
  props: ['value'],
  methods: {
    timeAgo(obj) {
      return moment(obj).fromNow();
    },
    isDate(obj) {
      return obj instanceof Date;
    },
  },
  computed: {
    formattedValue() {
      if (this.isDate(this.value)) {
        return this.timeAgo(this.value);
      } else {
        return this.value;
      }
    },
  },
};
</script>
