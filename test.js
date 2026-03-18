fetch('https://discord.com/api/webhooks/1483575057572823102/12TVS8JFAVTb_M1Chk-hje4cL5FDMB_niRX80EWdiE0DnnwQGVmLxXjX_REQxH_FopZS', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({content: 'TEST from console'})
}).then(r => r.status).then(console.log);
