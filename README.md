# droplet-cli
A minimalistic node.js-based CLI to quickly restore+start and snapshot+stop+destroy digital ocean droplets so you only pay for them when you actually use them.

<img src="https://i.imgur.com/gVN0aXx.png" alt="screenshot of the droplet-cli" width="500px"/>

## Story

*tl;dr: A stopped digital ocean droplet still costs money. I wanted a quick and easy way to automatically snapshot+stop+destroy my droplet and restore+start it whenever I want, so I don't have to pay for it when I don't need it (except a tiny fee for the snapshot)*

It all started with Minecraft.. My friends and I loved playing together, so we needed a server. As a student I got a 50 bucks voucher for Digital Ocean (props to Github Student Developer Pack), so the decision was made 😁

Digital Ocean is quite amazing. It abstracts away the hassle of raw server administration with their "Droplet" approach (think docker images) but without cutting your flexibility. What I especially liked though: You only pay for what you need (well.. not really, but I'll get to that). We only had time to play 4 times a month for a couple hours, so there was no point in renting a server 24/7, 30 days a month.

So I started the droplet, we played, I stopped the droplet. This went on until my first invoice came, because droplets **do** cost money even if shut down. I figured the only option to circumvent this would be to first create a **snapshot** of said droplet, then **stop** and completely **delete** the droplet, and next time **restore** the snapshot and **start** a new droplet. Besides of being a cumbersome amount of steps, it also takes quite a few minutes for digital ocean to process theses actions, so I wanted to make life simpler by creating the droplet-cli.


## Setup
`
npm install
`

## Run
`
node index.js
`

## Usage
1. Upon first start, you'll be asked for your **personal access token**, which allows the cli to access your droplets. You can generate a new token in the digital ocean control panel by clicking on **api** in the left sidebar. After you entered it, it gets stored in ~/.dropletcli.
1. First of all, the cli scans if there's any droplet running. You then get presented 4 options:
    * Recreate Server
    * Destroy Server
    * Reboot Server
    * Exit
1.
    1. If there's no droplet running, you can choose **Recreate Server** and **Exit**. The first option will scan your snapshots, restore the latest one into a droplet and start that droplet.
    1. If a droplet is running, you can choose **Destroy Server**, **Reboot Server** and **Exit**. The first option will stop your droplet, then create a snapshot from it and upon success destroy the droplet.

## Recommendation
Add an alias to your *.bash_profile* file or similar, so you can simply type `dcli` to run

`
echo "alias dcli='node /path/to/the/cli/index.js'" >> ~/.bash_profile    
`

## Disclaimer
This is not an official digital ocean product, so use this tool at your own risk
