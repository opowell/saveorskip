<template>
    <div>
        saveorskip >> 
        <router-link :to='{ name: "profiles" }'>Profiles</router-link>
        |
        <router-link :to='{ name: "account" }'>Account</router-link>
        |
        <router-link :to='{ name: "scrapers" }'>Scrapers</router-link>
    </div>
</template>

<script>

export default {
  name: 'RouterTabs',
}
</script>

<style scoped>
    * {
        font-size: 10pt;
    }
</style>
