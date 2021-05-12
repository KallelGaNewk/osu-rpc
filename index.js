const DiscordRPC = require("discord-rpc");
const WebSocket = require("ws");
const config = require("./config");

const ws = new WebSocket(config.wsURL);
const rpc = new DiscordRPC.Client({ transport: "ipc" });
const cooldown = 15 * 1000; // activity can only be set every 15 seconds

rpc.on("ready", () => {
  console.log("osu!rpc ready!");
  console.log(
    `Welcome ${rpc.user.username}#${rpc.user.discriminator}! (ID: ${rpc.user.id})`
  );

  let data;

  ws.on("message", (rd) => {
    data = JSON.parse(rd);
  });

  let setActivity = () => {
    if (!data) return;

    if (data.menu.bm.set <= 1) {
      return rpc.setActivity({
        details: `${data.menu.bm.metadata.artist} - ${data.menu.bm.metadata.title}`,
        state: `In menu`,
        largeImageKey: config.assetId,
      });
    }

    let formattedData = {
      beatmap: {
        url: `https://osu.ppy.sh/beatmapsets/${data.menu.bm.set}`,
        title: `${data.menu.bm.metadata.artist} - ${data.menu.bm.metadata.title}`,
        mapper: data.menu.bm.metadata.mapper,
        difficulty: data.menu.bm.metadata.difficulty,
        bpm: `${
          data.menu.bm.stats.BPM.min !== data.menu.bm.stats.BPM.max
            ? `${data.menu.bm.stats.BPM.min}-${data.menu.bm.stats.BPM.max}`
            : data.menu.bm.stats.BPM.min.toString()
        }`,
      },
      score: data.gameplay.score,
      accuracy: data.gameplay.accuracy,
      combo: data.gameplay.combo,
      hits: {
        0: data.gameplay.hits["0"],
        50: data.gameplay.hits["50"],
        100: data.gameplay.hits["100"],
        300: data.gameplay.hits["300"],
        grade: data.gameplay.hits.grade.current,
      },
      pp: data.gameplay.pp,
    };

    // In menu
    if (!formattedData.hits.grade) {
      return rpc.setActivity({
        details: formattedData.beatmap.title,
        state: `In menu`,
        largeImageKey: config.assetId,
        largeImageText: `BPM: ${formattedData.beatmap.bpm} | Mapper: ${formattedData.beatmap.mapper}`,
        instance: false,
        buttons: [{ label: "Beatmap", url: formattedData.beatmap.url }],
      });
    }

    // In game
    // let hits = `${formattedData.hits["300"]}x300 : ${formattedData.hits["100"]}x100 : ${formattedData.hits["50"]}x50 : ${formattedData.hits["0"]}xMiss`;

    rpc.setActivity({
      // details: `${formattedData.beatmap.title} [${formattedData.beatmap.difficulty}] mapped by ${formattedData.beatmap.mapper}`,
      // state: `${formattedData.pp.current}pp | ${formattedData.hits.grade} : ${formattedData.accuracy}% : Score: ${formattedData.score} | ${hits}`,
      details: `${formattedData.beatmap.title} [${formattedData.beatmap.difficulty}]`,
      state: `${formattedData.pp.current}pp | ${formattedData.hits.grade} : ${formattedData.accuracy}% | Score: ${formattedData.score}`,
      largeImageKey: config.assetId,
      largeImageText: `Combo: ${formattedData.combo.current}x (${formattedData.combo.max}x max) | BPM: ${formattedData.beatmap.bpm}`,
      buttons: [
        { label: "Beatmap", url: formattedData.beatmap.url },
        {
          label: "Profile",
          url: `https://osu.ppy.sh/users/${encodeURI(data.gameplay.name)}`,
        },
      ],
    });
  };

  setActivity();
  const interval = setInterval(setActivity, cooldown);
  ws.on("close", () => {
    clearInterval(interval);
    process.exit(1);
  });
});

rpc.login({ clientId: config.applicationId }).catch(console.error);
