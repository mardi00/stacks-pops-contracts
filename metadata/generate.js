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
    writeTextFile(meta, `./stacks-pops-metadata/stacks-pops-${item.edition}.json`, item.edition);
    writeTextFile(frozenMeta, `./frozen-stacks-pops-metadata/frozen-stacks-pops-${item.edition}.json`, item.edition);
  }); 
}

start();



function getBaseFrozenMetadata (item) {
  const data = {
    "version": 1,
    "name": `Frozen Stacks Pops ${item.name}`,
    "attributes": [],
    "image": `ipfs://QmdqZxgqnhh1bVmzu6VZDkAgUeV44qxhAyUc6dnbveq6FQ/${item.edition}.png`,
  };
  return data;
}

function getBaseMetadata (item) {
  const data = {
    "version": 1,
    "name": `Stacks Pops ${item.name}`,
    "attributes": [],
    "image": `ipfs://QmPAenbtyzFXCYWnmbcp1gRoJeH229nr4y37Gb32ePLSv6/${item.edition}.png`,
  };
  return data;
}

