import fs from "fs";
import path from "path";
import dirname from "./dirname.cjs";
const { __dirname } = dirname;

// make sure configuration is specified in package.json
const pkg = JSON.parse(
    fs.readFileSync( path.join( __dirname, "../package.json" ) )
);

export const config = pkg["minecraft-aws"];

if ( !config || !config.target || !config.commands )
{
    error(`The "minecraft-aws" configuration is missing from package.json.
Add the following (and customize it):
"minecraft-aws": ${JSON.stringify(
        {
            target: { host: "<minecraft-server-ip>", port: 25565 },
            commands: {
                start: "aws ec2 start-instances --instance-ids i-xxxxxxxxxxxxxxxxx",
                shutdown: "aws ec2 stop-instances --instance-ids i-xxxxxxxxxxxxxxxxx",
            },
            whitelist: {
                enabled: true,
                path: "./whitelist.json"
            },
        },
        null,
        2
    )}`);
    process.exit(1);
}

if( config && config.whitelist && config.whitelist.enabled && config.whitelist.enabled == 'true' )
{
    try
    {
        if( fs.accessSync( config.whitelist.path, fs.constants.F_OK ) )
        {
            info( `Whitelist support is enabled; using file ${config.whitelist.path}` );
        }
    }
    catch( error )
    {
        error( `The "minecraft-aws" configuration in package.json has whitelist support enabled, but the file does not exist or is unreadable. Please copy the whitelist.json file from your Minecraft server, or disable whilelist support.` );
        process.exit( 1 );
    }
}
