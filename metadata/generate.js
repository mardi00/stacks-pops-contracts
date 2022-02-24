const fs = require ('fs');
const items = require("./items.json");

function writeTextFile(meta, path, id)
{
  fs.writeFile(path, JSON.stringify(meta), (err) => {
    if (err) console.log('Error writing file:', err);
  });
}

function generateMetada(item) {
  let score = 0;
  item.attributes.forEach((attribute)=> {
    score += getRarity(attribute.name);
  });
  writeTextFile(s);
  return score/item.attributes.length;
}

function start() {
  items.forEach((item)=>{
    const frozenMeta = getBaseFrozenMetadata(item);
    const meta = getBaseMetadata(item);
    item.attributes.forEach((attribute) => {
      const split = attribute.name.split(" - ");
      frozenMeta["attributes"].push({
        "trait_type": split[0],
        "value": split[1],
      });
      meta["attributes"].push({
        "trait_type": split[0],
        "value": split[1],
      });
    });
    writeTextFile(meta, `./stacks-pops/stacks-pops-${item.edition}.json`, item.edition);
    writeTextFile(frozenMeta, `./frozen-stacks-pops/frozen-stacks-pops-${item.edition}.json`, item.edition);
  }); 
}

start();



function getBaseFrozenMetadata (item) {
  const data = {
    "version": 1,
    "name": `Frozen Stacks Pops ${item.name}`,
    "attributes": [],
    "image": `ipfs://QmdqZxgqnhh1bVmzu6VZDkAgUeV44qxhAyUc6dnbveq6FQ/${item.edition}.png`,
    "properties": {
      "external_url": "https://stackspops.club/",
      "artist": "Axopoa",
      "description": "A limited collection of 10,0000 frozen popsicles.",
      "collection_name": "Frozen Stacks Pops",
      "collection_size": 10000,
      "collection_image": "ipfs://QmaeqFSzd1r28KKPL34LBsPXB9K8C3QEqXDtQbxjSBq3yo/stacks-pops-image.png"
    }
  };
  return data;
}

function getBaseMetadata (item) {
  const data = {
    "version": 1,
    "name": `Stacks Pops ${item.name}`,
    "attributes": [],
    "image": `ipfs://QmPAenbtyzFXCYWnmbcp1gRoJeH229nr4y37Gb32ePLSv6/${item.edition}.png`,
    "properties": {
      "external_url": "https://stackspops.club/",
      "artist": "Axopoa",
      "description": "A limited collection of 10,0000 popsicles.",
      "collection_name": "Stacks Pops",
      "collection_size": 10000,
      "collection_image": "ipfs://QmaeqFSzd1r28KKPL34LBsPXB9K8C3QEqXDtQbxjSBq3yo/stacks-pops-image.png"
    }
  };
  return data;
}

