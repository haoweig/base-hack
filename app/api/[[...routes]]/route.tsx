/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { ethers } from "ethers";


const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

// Uncomment to use Edge Runtime
// export const runtime = 'edge'

async function checkDegenBalance(address: string): Promise<number> {
  return new Promise<number>(async (resolve, reject) => {
      try {
          const baseProvider = new ethers.JsonRpcProvider('https://mainnet.base.org');
          // The DEGEN Token Contract Address on Base and its ABI for balance check
          const degenAddress = '0x4ed4e862860bed51a9570b96d89af5e1b0efefed'; // Replace with the actual contract address
          const tokenABI = ["function balanceOf(address owner) view returns (uint256)"];

          // Create an instance of the contract
          const tokenContract = new ethers.Contract(degenAddress, tokenABI, baseProvider);
          // const balance = await tokenContract.balanceOf(address);
          try {
            const balance = await tokenContract.balanceOf(address);
            const balanceOfAddress = ethers.formatUnits(balance, 18);
            console.log("This is balance", balanceOfAddress);
            const balanceAsFloat = parseFloat(balanceOfAddress);
            resolve(balanceAsFloat);
          } catch (error) {
            console.error('Error fetching balance:', error);
            // Return 0 if there's an error fetching the balance
            resolve(0);
           }

      } catch (error) {
          reject(error);
      }
  });
}

async function getProfilePic(fid:number): Promise<string>{
  try{
    const resp = await fetch(`https://nemes.farcaster.xyz:2281/v1/userDataByFid?fid=${fid}&user_data_type=1`);
    if (resp.ok){
      const responseData = await resp.json();
      const pfpUrl = responseData.data.userDataBody.value;
      console.log(pfpUrl);
      return pfpUrl
    }else {
      throw new Error("Failed to fetch profile picture: " + resp.statusText);
    }
  }catch (error){
    console.error('Error fetching data:', error);
    throw error;
  }
}


async function getConnectedAddress(fid: number): Promise<string>{
  try {
    const response = await fetch(`https://searchcaster.xyz/api/profiles?fid=${fid}`);
    const data = await response.json();
    // Check if data is an array and has at least one element
    if (Array.isArray(data) && data.length > 0) {
        // Get the first element of the array
        const firstElement = data[0];

        // Print out the connectedAddresses property
        const connectedAddresses = data.map(item => item.connectedAddresses).flat();
        // return connectedAddresses;
        return connectedAddresses[0];
    } else {
        console.log('No data found');
        return "";
    }
} catch (error) {
    console.error('Error fetching data:', error);
    throw error;
}
}

app.frame('/printdegenimage', (c) => {
  return c.res({
    imageAspectRatio :'1:1',
    image: `https://frog-frame-ten.vercel.app/NC_State_Wolfpack_logo.svg.png`,
    action: '/',
    intents: [<Button>Return to start</Button>],
  })
})

app.frame('/degen', (c) => {
  const { buttonValue, inputText, status,frameData } = c
  // gets the first connected address
  // const fid = frameData?.fid?? 0; // Providing a default value of 0 if fid is undefined
  let fid = 376075;
  console.log("Fid is ",fid)
  return getConnectedAddress(fid)
    .then(firstAddress => {
        // firstAddress = '0x28d671941648c4153464A09FcF8f93Ea0727e963';
        // firstAddress = '0x2c9A402eB88Bdb0D4D5267F72E5f4d84Dc74B255';
        console.log("Connected Addresses:", firstAddress);

        return getProfilePic(fid).then((pfpUrl)=>{
          console.log("I am here and got profile pic url",pfpUrl);
          return checkDegenBalance(firstAddress).then((value)=>{
            // val is the degen bal of the first address
            console.log("This is ur degen bala val",value)
            if (value === 0){
              console.log("GET MORE DEGEN");
              return c.res({
                action: '/',
                imageAspectRatio: '1:1',
                image: pfpUrl,
                imageOptions: { width: 1200, height: 630 },
                intents: [<Button>You have 0 degen in your connected account. You have to get more degen </Button>],
              })
            } else {
              console.log("HUAT LA");
              return c.res({
                action: '/printdegenimage',
                imageAspectRatio: '1:1',
                image: `https://frog-frame-ten.vercel.app/NC_State_Wolfpack_logo.svg.png`,
                intents: [<Button>Print my image 🏀 </Button>],
              })
            }
          })
        })


    })
    .catch(error => {
      console.error("error: ", error)
      // Handle error and return appropriate response
      return c.res({
        action: '/',
        image: (
          <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
            Error: Unable to fetch profile
          </div>
        ),
        intents: [<Button>Try Again 🔄</Button>],
      })
    })

})

app.frame('/', (c) => {
  // gets the fid
  const { buttonValue, inputText, status,frameData } = c
  const fid = frameData?.fid?? 0; // Providing a default value of 0 if fid is undefined

  // for users with no fid
  if (fid <= 0){
    return c.res({
      action: '/',
      image: (
        <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
          User does not have valid FID
        </div>
      ),
      intents: [<Button>Try Again 🔄</Button>],
    })
  }

  console.log("This is fid",fid);
  

  return c.res({
    imageAspectRatio :'1:1',
    image: `https://base-hack.vercel.app/degen.webp`,
    action: '/degen',
    title: '🏀 Final 4 predictions? 🏆',
    intents: [
      <Button value="DEGEN">GMDegened</Button>
    ],
  })
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
