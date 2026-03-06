<script lang="ts">
import { P2PHost } from '$lib/p2p'

let roomId = 'jukebox-room'

const p2p = new P2PHost(roomId)

let roomName = $state('')
let name = $state('')
</script>

<h3>Host Jukebox</h3>

<pre>
  Status  : {p2p.status}
  ROOM    : {roomId}
  Clients : {p2p.clientIds.join(', ')}
</pre>
