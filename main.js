/** Connect to Moralis server */
const serverUrl = "https://woycgfnr2rwq.usemoralis.com:2053/server";
const appId = "T5VJK4Zw8ub6KAee6UzH35JI5aRI70JkaDzIWnLr";
Moralis.start({ serverUrl, appId });
let user;

/** Add from here down */
async function login() {
    user = Moralis.User.current();
    if (!user) {
        try {
            user = await Moralis.authenticate({ signingMessage: "Hello World!" })
            initApp()
        } catch (error) {
            console.log(error)
        }
    } else {
        Moralis.enableWeb3()
        initApp()
    }
}

function initApp() {
    document.getElementById("app").removeAttribute("hidden")
    document.getElementById("submit_button").onclick = submit;
}

async function submit() {
    // get image data
    const image = document.getElementById("input_image").files[0]
    const imageFile = new Moralis.File(image.name, image)
    
    // upload image to ipfs
    await imageFile.saveIPFS()
    
    // create metadata with image hash & data
    const imageHash = imageFile.hash()
    const metadata = {
        name: document.getElementById('input_name').value,
        description: document.getElementById('input_description').value,
        image: "/ipfs/" + imageHash
    }
    // upload metadata to ipfs
    const jsonFile = new Moralis.File("metadata.json", { base64: btoa(JSON.stringify(metadata))});
    await jsonFile.saveIPFS();

    // upload to Rarible (plugin)
    const metadataHash = jsonFile.hash()
    const result = await Moralis.Plugins.rarible.lazyMint({
        chain: 'rinkeby',
        userAddress: user.get("ethAddress"),
        tokenType: 'ERC1155',
        tokenUri: '/ipfs/' + metadataHash,
        supply: 100,
        royaltiesAmount: 5, // 0.05% royalty. Optional
    })

    // reflect on the UI
    const tokenAddress = result.data.result.tokenAddress;
    const tokenId = result.data.result.tokenId;
    const url = `https://rinkeby.rarible.com/token/${tokenAddress}:${tokenId}`;
    const successMessage = document.getElementById("success_message");
    successMessage.innerHTML = `NFT minted! <a target="_blank" href="${url}">View NFT</a>`
    successMessage.removeAttribute("hidden");
    setTimeout(() => {
        successMessage.setAttribute("hidden", true);
    }, 3000);

}

login();

// async function logOut() {
//     await Moralis.User.logOut();
//     console.log("logged out");
// }

// document.getElementById("btn-login").onclick = login;
// document.getElementById("btn-logout").onclick = logOut;

