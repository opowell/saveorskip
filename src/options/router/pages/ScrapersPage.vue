<template>
  <div>
        <h2>Scrapers</h2>
        <div v-for='scraper in scrapers' :key='scraper'>{{scraper}}</div>
  </div>
</template>

<script>

export default {
  name: 'ScrapersPage',
  data: function() {
    return {
      scrapers: [
        'reddit', 
        'hacker news',
      ]
    }
  }
}
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
