fetch('https://discord.com/api/webhooks/1483674310894686218/4vfFs_gCMSHonr7AGWKf4yqgoE9DSuaTot7XhXemDE6o5b8GQWraBbk7qbY5S9G2VDST', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({content: 'TEST from console'})
}).then(r => r.status).then(console.log);
