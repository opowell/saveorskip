<template>
    <div>
        <router-link :to='{ name: "home" }'>Home</router-link>
        |
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
};
</script>

<style scoped>
div {
  margin-bottom: 1em;
  font-size: 12pt;
}
</style>
