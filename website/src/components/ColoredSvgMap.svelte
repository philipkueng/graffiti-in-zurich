<script>
  import Legend from "./Legend.svelte";
  import Map from "./Map.svelte";

  export let data;
</script>

<style>
  .map-container {
    height: 70%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>

<div class="map-container">
  <Legend {data} />
  <Map {data} />
</div>
