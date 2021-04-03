const DiscordRPC = require('discord-rpc')
const WebSocket = require('ws')
const config = require('./config')

const ws = new WebSocket(config.wsURL)
const rpc = new DiscordRPC.Client({ transport: 'ipc' })
const cooldown = 15 * 1000 // activity can only be set every 15 seconds

rpc.on('ready', () => {
  console.log('osu!pp ready')
  let data

  ws.on('message', (rd) => {
    let osuData = JSON.parse(rd)
    data = {
      beatmap: `${osuData.menu.bm.metadata.artist} - ${osuData.menu.bm.metadata.title} [${osuData.menu.bm.metadata.difficulty}] mapped by ${osuData.menu.bm.metadata.mapper}`,
      gameplay: {
        score: osuData.gameplay.score,
        accuracy: `${osuData.gameplay.accuracy}%`,
        combo: `${osuData.gameplay.combo.current}x (${osuData.gameplay.combo.maxThisPlay}x max)`,
        hits: `(Grade: ${!!osuData.gameplay.hits.grade.current ? osuData.gameplay.hits.grade.current : '?'}) ${osuData.gameplay.hits['300']}x300 ${osuData.gameplay.hits['100']}x100 ${osuData.gameplay.hits['50']}x50 ${osuData.gameplay.hits['0']}xMiss`,
        pp: `${osuData.gameplay.pp.current}pp`
      }
    }
  })

  let setActivity = () => {
    if (!data) { return }
    rpc.setActivity({
      details: `${data.beatmap}`,
      state: `${data.gameplay.pp} | ${data.gameplay.hits}`,
      largeImageKey: config.assetId,
      largeImageText: `Score: ${data.gameplay.score} | ${data.gameplay.accuracy}`,
      instance: false
    })
  }

  setActivity()
  const interval = setInterval(setActivity, cooldown)
  ws.on('close', () => {
    clearInterval(interval)
    process.exit(1)
  })
})

rpc.login({
  clientId: config.applicationId
})
  .catch(console.error)