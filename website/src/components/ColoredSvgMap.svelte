<script>
  import Map from "./Map.svelte";
  import { beforeUpdate, afterUpdate } from "svelte";

  export let data;

  $: districtColors = getColors(data);

  function getColors(data) {
    let styles = [];
    data.districts.map(
      district =>
        (styles = [
          ...styles,
          { name: district.name.replace(" ", ""), color: district.color }
        ])
    );
    return styles;
  }
</script>

<style>
  .map-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
</style>

<div class="map-container">
  <Map bind:districtColors />
</div>
