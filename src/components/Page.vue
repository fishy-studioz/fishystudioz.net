<script setup lang="ts">
import { RouterView } from "vue-router";
import DiscordWidget from "./DiscordWidget.vue";
</script>

<script lang="ts">
export default {
  props: {
    title: {
      type: String,
      required: true
    }
  }
};
</script>

<template>

  <head>
    <meta charset="UTF-8">
    <meta property="og:image" content="https://www.fishystudioz.net/assets/meta.png" />
    <meta name="description"
      content="Fishy Studioz is a development group on Roblox. We make games, services, and more. We consider anyone who wants to contribute, just join our Discord server or make pull requests." />
    <meta name="theme-color" content="#8CE2F5" />
    <title>{{ title }} | Fishy Studioz</title>
    <link rel="shortcut icon" type="image/x-icon" href="assets/favicon.ico">
    <link rel="stylesheet" type="text/css" href="css/style.css">
  </head>
  <main>
    <h1>{{ title }}</h1>
    <DiscordWidget />
    <RouterView />
  </main>
  <footer>
    <hr>
    <p>Copyright &copy; {{ new Date().getFullYear() }} Fishy Studioz</p>
  </footer>
</template>