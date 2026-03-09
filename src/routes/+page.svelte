<div class="layout-readable center stack page">
  <header class="stack hero">
    <h1>Jukebox</h1>
    <p class="tagline">A collaborative music player for your classroom</p>
  </header>

  <div class="layout-split">
    <section class="stack card">
      <div class="stack card-body">
        <h2>Host a Room</h2>
        <p>
          Create a room, share the code with your class, and control playback.
        </p>
      </div>
      <a href="/host" class="btn primary block">Host a Room</a>
    </section>

    <section class="stack card">
      <div class="stack card-body">
        <h2>Join a Room</h2>
        <p>Enter a room code to queue songs and vote on what plays next.</p>
      </div>
      <a href="/join" class="btn block">Join a Room</a>
    </section>
  </div>
  <a
    href="https://github.com/Teach-Stack/jukebox"
    target="_blank"
    class="github-link"
    aria-label="View source on GitHub"
  >
    Check out the code on GitHub
  </a>
</div>

<style>
.page {
  min-height: 100vh;
  justify-content: center;
  padding-block: var(--pad-xxxl);
}

.hero {
  text-align: center;
  align-items: center;
}

.tagline {
  color: var(--slate-6);
  font-size: 1.125rem;
  margin: 0;
}

.card {
  background-color: #fff;
  border: var(--border-1);
  border-color: var(--slate-3);
  border-radius: var(--br-m);
  padding: var(--pad-xxl);
  justify-content: space-between;
}

.card-body {
  flex: 1;
}

.github-link {
  color: var(--slate-6);
  text-align: center;

  &:hover {
    color: var(--slate-8);
  }
}
</style>
