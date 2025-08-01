<main>
  <div class="content">
    <h1>Google Chrome Extension</h1>
    <p>Rsbuild with Svelte</p>
  </div>
</main>

<script lang="ts">
console.log('Running popup');
</script>

<style>
.content {
  display: flex;
  min-height: 100vh;
  line-height: 1.1;
  text-align: center;
  flex-direction: column;
  justify-content: center;
}

.content h1 {
  font-size: 3.6rem;
  font-weight: 700;
}

.content p {
  font-size: 1.2rem;
  font-weight: 400;
  opacity: 0.5;
}
</style>
