<script>
  import Legend from "./Legend.svelte";
  import Map from "./Map.svelte";

  export let data;
</script>

<style>
  .map-container {
    width: 75%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>

<div class="map-container">
  <Legend {data} />
  <Map {data} />
</div>
