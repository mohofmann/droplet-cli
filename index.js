'use strict'

const prompts = require('prompts');
const color = require('kleur');
const https = require('https');
const homeDir = require('os').homedir();
const fs = require('fs');

const path = homeDir+'/.dropletcli';
let dropletId = '';
let token = '';
const requestOptions = function (method, path) {
  return {
    host: 'api.digitalocean.com',
    port: 443,
    path: path,
    method: method,
    headers: { 
      'content-type': 'application/json',
      'authorization': 'Bearer ' + token
    }
  }
};


const getDropletInfo = async function () {
  let dataChunks = []
  return new Promise ((resolve, reject) => {
  	let req = https.request(
  		requestOptions('GET', '/v2/droplets'),
  		res => {
  			res.on('data', body => {
  				dataChunks.push(body)
  			})
  			res.on('end', async () => {
  				let data = JSON.parse(Buffer.concat(dataChunks))
          if (data.id && data.id === 'Unauthorized') resolve(null)
          else resolve(data.droplets[0])
  			})
  		}
  	)
    req.on('error', (e) => {
      resolve(null)
    })
  	req.end()
  })
};

const getSnapshots = function () {
	let dataChunks = []
	return new Promise ((resolve, reject) => {
		let req = https.request(
    requestOptions('GET', '/v2/snapshots'),
    res => {
      res.on('data', body => {
        dataChunks.push(body)
      })
      res.on('end', () => {
        let data = JSON.parse(Buffer.concat(dataChunks))
        resolve(data)
      })
    })

    req.end()
	})
}

const startDroplet = function () {
  return new Promise ((resolve, reject) => {
    let req = https.request(
      requestOptions('POST', '/v2/droplets/' + dropletId + '/actions'),
      res => {
        resolve()
      }
    )
    req.write('{"type": "power_on"}')
    req.end()
  })
};

const wait = function (ms) {
	return new Promise ((resolve, reject) => {
		setTimeout(resolve, ms)
	})
}

const stopDroplet = function () {
  let dataChunks = []
  return new Promise ((resolve, reject) => {
    let req = https.request(
      requestOptions('POST', '/v2/droplets/' + dropletId + '/actions'),
      res => {
        resolve()
      }
    )
    req.write('{"type": "shutdown"}')
    req.end()
  })
};

const rebootDroplet = function () {
  let dataChunks = []
  if (!dropletId) {
    console.log(color.bold().red("! ") + "No droplet exists.")
    return
  }
  return new Promise ((resolve, reject) => {
    let req = https.request(
      requestOptions('POST', '/v2/droplets/' + dropletId + '/actions'),
      async res => {
        console.log(color.bold().cyan("… ") + "Initiating reboot..")
        await confirmStart();
        resolve()
      }
    )
    req.write('{"type": "reboot"}')
    req.end()
  })
};

const deleteDroplet = function () {
	return new Promise( (resolve, reject) => {
		let req = https.request(
			requestOptions('DELETE', '/v2/droplets/' + dropletId),
			res => {
				console.log(color.bold().green("✔ ") + "Old droplet deleted.")
				resolve()
			}
		)
		req.end()
	})
}

const deleteSnapshot = async function () {
  let data = await getSnapshots()
  if (data.snapshots[1]) {
    let req = https.request(
      requestOptions('DELETE', '/v2/snapshots/' + data.snapshots[0].id),
      res => {
        console.log(color.bold().green("✔ ") + "Old snapshot deleted.")
        return
      }
    )
    req.end()
  }
}

const confirmStart = async function () {
	console.log(color.bold().cyan("… ") + "Waiting for startup..")
	while (true) {
		let data = await getDropletInfo()
		if (data && data.status == 'active') {
			console.log(color.bold().green("✔ ") + "Droplet successfully started.")
      console.log(color.bold().blue("  IP Address: " + data.networks.v4[0].ip_address))
			return
		} else {
			await wait(3000)
		}
	}
};

const createDroplet = function () {
	return new Promise (async (resolve, reject) => {
		let data = await getSnapshots()
		let imageId = data.snapshots[1].id
		let dataChunks = []
		let req = https.request(
			requestOptions('POST', '/v2/droplets'),
			async function (res) {
				console.log(color.bold().cyan("… ") + "Droplet gets created..")
				resolve()
			}
		)
		req.write('{"name": "minecraft", "region": "fra1", "size": "s-1vcpu-2gb", "image": ' + imageId + ', "ssh_keys": [24034090]}')
		req.end()
	})
};

const createSnapshot = function () {
	console.log(color.bold().cyan("… ") + "Creating droplet snapshot, hold on..")
	let dataChunks = []
  return new Promise ((resolve, reject) => {
    let req = https.request(
      requestOptions('POST', '/v2/droplets/' + dropletId + '/actions'),
      res => {
        resolve()
      }
    )
    req.write('{"type": "snapshot", "name": "hummel-snapshot"}')
    req.end()
  })
};

const confirmSnapshot = async function () {
	while (true) {
		let data = await getSnapshots()
		if (data && data.snapshots[2] && data.snapshots[2].name == "hummel-snapshot") {
			console.log(color.bold().green("✔ ") + "Snapshot successfully created.")
			return
		} else {
			await wait(3000)
		}
	}
};

const confirmStop = async function () {
	console.log(color.bold().cyan("… ") + "Waiting for shutdown..")
	while (true) {
		let data = await getDropletInfo()
		if (data.status == 'off') {
			console.log(color.bold().green("✔ ") + "Droplet successfully shut down.")
			return
		} else {
			await wait(3000)
		}
	}
};

const getToken = async () => {
  let token = null;
  try {
    token = fs.readFileSync(path, 'utf8');
  } catch(e) {
    token = await promptToken()
  }
  return token
}

const setToken = token => {
  fs.writeFile(path, token, function (err) {
    if (err) console.log("Token could not be saved");
  });
};

const promptToken = async () => {
  console.log("To let you manage your droplets, the CLI needs your Personal Access Token")
  console.log("For security reasons we recommend to create a token exclusively for the CLI")
  console.log("Create a token in the Digital Ocean control panel by clicking 'API' in the sidebar")
  console.log("")
  const response = await prompts({
    type: 'text',
    name: 'token',
    message: 'Personal Access Token'
  });
  setToken(response.token);
  return response.token;
};

(async () => {
	console.log(color.yellow().bold("\nDroplet Command Line Interface 1.2"))
  console.log(color.gray().dim("© 2019, Moritz Hofmann\n"))

  token = await getToken();
  let data = await getDropletInfo();
  while (data === null) {
    console.log("The current Personal Access Token is invalid")
    token = await promptToken();
    data = await getDropletInfo();
  }
	if (data) {
		dropletId = data.id
		console.log(color.bold().yellow("! ") + "Droplet is currently " + data.status)
    console.log(color.bold().blue("  IP Address: " + data.networks.v4[0].ip_address))
	} else {
    console.log(color.bold().yellow("! ") + "No droplet exists. Scanning snapshots..")
    let snapshots = await getSnapshots()
    console.log(color.bold().blue("  Latest snapshot from: " + snapshots.snapshots[1].created_at))
	}
  console.log("")

	const response = await prompts({
    type: 'select',
    name: 'id',
    hint: ' ',
    message: 'What would you like to do?',
    warn: 'Requires a droplet',
    choices: [
      { title: 'Recreate Server', value: 1 }, 
      { title: 'Destroy Server', value: 2, disabled: !data},
      { title: 'Reboot Server', value: 3, disabled: !data},
      { title: 'Exit', value: 4}
    ]
   });
	
  switch (response.id) {
    case 1:
    	console.log("")
    	await createDroplet();
    	await confirmStart();
    	break;
    case 2:
    	console.log("")
      if (data) {
    	  await stopDroplet();
    	  await confirmStop();
    	  await createSnapshot();
    	  await confirmSnapshot();
        await deleteSnapshot();
        await deleteDroplet();
      } else {
        console.log(color.bold().red("! ") + "No droplet exists.")
      }
    	break;
    case 3:
      console.log("");
      await rebootDroplet();
      break;
    case 4: console.log("See you next time!"); break;
    default: console.log("Invalid Command"); break;
  }
  console.log("")
})()
