<script lang="ts">
  import { APP_NAME } from '$lib/utils/constants';
</script>

<header class="header-bar">
  <h1 class="header-bar__title">{APP_NAME}</h1>
  <p class="header-bar__subtitle">Visualize Go Abstract Syntax Tree</p>
</header>

<style>
  .header-bar {
    background-color: #2c3e50;
    color: white;
    padding: 1rem 2rem;
    border-bottom: 2px solid #34495e;
  }

  .header-bar__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .header-bar__subtitle {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: #ecf0f1;
    opacity: 0.9;
  }
</style>
