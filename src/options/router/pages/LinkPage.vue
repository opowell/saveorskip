<template>
  <div>
      <b-breadcrumb :items="crumbs"/>
      <h2>{{$route.params.linkId}}</h2>
      <div>
        <button>save changes</button>
        <button @click.prevent.stop='reset' type='button'>reset</button>
        <input type='text' placeholder="add / filter">
        <button>add property</button>
        <button>remove property</button>
        <select>
          <option 
            v-for='fieldName in fieldNames' 
            :key='fieldName + renderCount'
            :value='fieldName'
          >
              {{fieldName}}
          </option>
        </select>
      </div>
      <div 
        v-for='fieldName in fieldNames' 
        :key='fieldName + renderCount'
        style='display: flex;'
        class='mt-3'>
        <div style='width: 10rem'>
          {{fieldName}}:
        </div>
        <input type='text' :value='link[fieldName]' style='width: 50rem'>
      </div>
  </div>
</template>

<script>
import * as idb from '../../../store/idb.js';

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
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      idb.loadLink({
        profileId: this.$route.params.profileId,
        linkId: this.$route.params.linkId,
      });
    },
    reset() {
      this.renderCount++;
    },
  },
  computed: {
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
