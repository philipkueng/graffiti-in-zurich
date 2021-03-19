<script>
  export let data;

  let legendBarHeight = 15;

  function getAspectWidth(legend, bucket) {
    const range = legend.maxValue - legend.minValue;
    return ((bucket.to - bucket.from) * 100) / range;
  }

  function getAspectXValue(legend, bucket) {
    const range = legend.maxValue - legend.minValue;
    return ((bucket.from - legend.minValue) * 100) / range;
  }

  function getColorClass(legendItem) {
    if (legendItem.color.colorClass !== undefined) {
      return legendItem.color.colorClass;
    }
    return "";
  }
</script>

<style>
  .legend {
    width: 50%;
    display: flex;
    justify-content: center;
    margin-bottom: 8px;
  }

  .legend-container {
    display: flex;
    flex-direction: column;
  }

  .legend-value-container {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .legend-border-container {
    position: relative;
  }

  .legend-buckets {
    height: 32px;
    width: 100%;
  }

  .legend-borders {
    position: absolute;
    height: 28px;
    top: 0;
    margin-left: -1px;
    border-right: 0.5px solid;
    border-left: 0.5px solid;
    width: 100%;
  }

  .legend-value-container--minVal,
  .legend-value-container--maxVal {
    font-size: 0.65em;
  }
</style>

<div class="legend">
  <div class="legend-container">
    <div class="legend-value-container">
      <span class="legend-value-container--minVal">{data.legend.minValue}</span>
      <span class="legend-value-container--maxVal">{data.legend.maxValue}</span>
    </div>
    <div class="legend-border-container">
      <svg class="legend-buckets">
        <g>
          {#each data.legend.buckets as bucket, index}
            <rect
              class="q-choropleth-legend-bucket"
              style="fill: {getColorClass(bucket)}"
              width="{getAspectWidth(data.legend, bucket)}%"
              height={legendBarHeight}
              x="{getAspectXValue(data.legend, bucket)}%"
              y={legendBarHeight - 4} />
          {/each}
        </g>
      </svg>
      <div class="legend-borders s-color-gray-6" />
    </div>
  </div>
</div>
