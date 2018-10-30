<template>
    <div>
        <button @click='removeSuggestedSource'>x</button>
        {{source.points}} // 
        <a :href='"http://" + source.url' target='_blank'>{{source.url}}</a>
    </div>
</template>

<script>
import store from '../../../store';

export default {
  name: 'SugggestedSourceDiv',
  props: ['source'],
  methods: {
      removeSuggestedSource: function() {
          let targetId = this.$route.params.id;
        store.dispatch('removeSuggestedSource', {
            url: this.source.url,
            targetId: targetId,
        });
        this.$parent.fetchData();
}
  }
};
</script>

<style scoped>
    button {
        margin: 5px;
        align-self: center;
    }
</style>
