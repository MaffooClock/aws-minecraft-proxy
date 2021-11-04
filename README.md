## Introduction

Hosting a Minecraft server on a properly-spec'd EC2 instance in AWS can get expensive, especially a heavily-modded instance that requires more CPU and RAM.  For private servers where only you and your friends can join, there are likely long periods of idle time when no one is playing.  That's a huge waste of money!

Wouldn't it be nifty to only pay for what you use?  This Minecraft Proxy is the perfect solution!  Keep your EC2 instance stopped when it's not being used, which pauses the billing clock, and starts up automatically when someone wants to play.  If you and your friends typically only play during evenings and weekends, or if there's no activity for an extended period of time due to burnout or whatever, this solution will help you reduce hosting costs considerably.  _**Huzzah!**_ 🎉


## Synopsis

Minecraft Proxy is a Node.js server that sits in front of the real Minecraft server.  It was designed primarily for ECS in AWS, but in theory could work with any similar VPS provider[^1].

Here's how it works:
  1. The Proxy is installed on its own server, separate from the Minecraft server.  This server can be very low spec'd, allowing it to qualify for Free Tier instances in AWS.
  1. When a player adds your server to their server list, they're actually "talking" to the Proxy, not the real server.
  1. When the client pings the server, the Proxy will send back information that is displayed in the server description that lets them know that the server is offline, but can be booted up if they'll make a connection attempts.
  1. The Proxy will handle the connection attempt, execute the command to start the server, then disconnect the client with a reason stating that the server is starting up and they'll need to wait to re-connect.
  1. When the client returns to the server list, and each time the Refresh button is clicked, the Proxy will update the server description with the current status of the boot-up.  That way, the player doesn't have to keep re-connecting and re-connecting to see if the server is up, and they'll see that progress is being made.
  1. While the Minecraft server is booting up, the Proxy will continually check the status.  When the game finally comes alive, the Proxy will switch into "pipe mode", passing all traffic directly between the client and the server without any processing, making it completely invisible (and fast!).  The Proxy will stay in this mode for as long as the server staus online and players are connected.
  1. As long as the server stays online, any player viewing the Multiplayer list will have the normal experience and can connect and play immediately
  1. After the last player disconnects, within a configurable amount of time, the Proxy will shutdown the Minecraft server and switch back to "proxy mode."
  

## Prerequisites

This solution was designed for EC2 on AWS, but in theory could work with any VPS similar VPS provider[^1].  This guide will assume you're using AWS.

- You must be familiar with installing and using [`awscli`](https://aws.amazon.com/cli/), particularly with [`ec2 start-instances`](https://docs.aws.amazon.com/cli/latest/reference/ec2/start-instances.html) and [`ec2 stop-instances`](https://docs.aws.amazon.com/cli/latest/reference/ec2/stop-instances.html), and setting up your environment with your AWS key and secret.
- Have the Instance ID from your Minecraft EC2 instance available.
- Have a new EC2 instance available for this Proxy (a [t2.micro](https://aws.amazon.com/ec2/instance-types/t2/) works perfectly and is in the Free Tier)
- The new EC2 instance will need:
  - [AWS Command Line Interface](https://aws.amazon.com/cli/)
  - [npm](https://www.npmjs.com/)
  - [Node.js](https://nodejs.org/en/) v14 or greater
  - Systemd (optional -- a system service will be automatically installed to enable the Proxy to start automatically at boot-up)


## Installation

1. Clone this repo onto the new instance that will be dedicated to the Proxy.  You can clone it anywhere, doesn't have to be a proper system location.
1. Run `install.sh`, which will install dependencies and start the service for the first time.  See note[^2]
    - If your server uses systemd, a system service will automatically be installed.
      *Note: the service will be configured to run as whatever user is currently being used to install the Proxy!*
1. Update `package.json` so that the `minecraft-aws` object has appropriate configuration values:
    - `target`: the IP address or hostname of the Minecraft server, as well as the TCP port (default is 25565)
    - `commands`: the commands needed to startup and shutdown the EC2 instance (should be `awscli ec2` commands, but could be augmented or changed altogether if you know what you're doing)
    - `whitelist`: if you want the Proxy to respect your whitelist, set the path to the whitelist.json file that you copied from the Minecraft server
1. Run `sudo systemctl restart minecraft-proxy` to reload the proxy server so it uses the new config.

Below is an example configuration.  **Bonus:** notice how the `shutdown` command first copies the whitelist.json file before actually shutting down the instance, which ensures the Proxy always has a current version.

```json
{
    "minecraft-aws": {
        "target": {
            "host": "123.45.67.89",
            "port": 25565
        },
        "commands": {
            "start": "aws ec2 start-instances --instance-ids i-xxxxxxxxxxxxxxxxx",
            "shutdown": "scp root@123.45.67.89:/opt/minecraft/server/whitelist.json ./whitelist.json && aws ec2 stop-instances --instance-ids i-xxxxxxxxxxxxxxxxx"
        },
        "whitelist": {
            "enabled": "true",
            "path": "./whitelist.json"
        }
    }
}
```

## Usage

Aside from starting the Proxy service, there's really nothing to _do_ with it directly.  Just fire up your Minecraft client, and in Multiplayer mode, add the IP address or hostname of the Proxy server, not the _real_ Minecraft server.  Or, if you already had your Minecraft server added, just edit it and change the address.

Refer to the [Synopsys](#synopsys) for details on how it works.


## Development Progress

Aside from the implementation of respecting Minecraft's `whitelist.json` file (which isn't perfect, but works), there are a number of other things I'd like to tweak or augment, so you can follow the development (and contribute) in the [Issues](https://github.com/MaffooClock/aws-minecraft-proxy/issues) section.


## Credit Where it's Due

This is a forked version of [`aws-minecraft-proxy`](https://github.com/birjolaxew/aws-minecraft-proxy) by **[Johan Fagerberg](https://github.com/birjolaxew)**.

The original project was functional, but it had one (trivial?) drawback: any connection would start and inactive server, even if the server was privatized by a whitelist.  Of course, this didn't actually *hurt* anything, but I didn't like the idea of allowing the server to start for a player that wouldn't be allow to join anyway.  Maybe this wouldn't happen very often, but even so, the whole point of this is to reduce hosting costs as much as possible.  Thus, having the proxy respect the whitelist seemed like a necessary feature.

Now, I could have made my changes to enable whitelist checking, and then just submit the changes in a pull request, but there were lost of other things in the code that I wanted to tweak.  Some of it was my pedantic-ness on code style, wording, and even how STDOUT was being presented.  Along the way, I found some things that were left unfinished or unused, so I kinda just kept going my own way.
  


[^1]:
    This solution can be used with VPS providers other than AWS, but makes sense only under the following conditions:
      - The VPS is billed hourly, and billing stops as long as the VPS is not running
      - The VPS provider offers an API that can be used to manage your instances, which includes the capability to start and stop your instances
    
    If you're billed regardless of instance state, or if there's no facility for remotely managing the state of your instances, then having a Proxy has no purpose and offers no benefit.
    
[^2]: Other than installing a systemd service, the installer makes no other changes to your system.  Removing the Proxy is as simple as deleting the directory you cloned and the systemd service file.
