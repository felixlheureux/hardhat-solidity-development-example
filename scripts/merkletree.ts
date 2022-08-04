import { MerkleTree } from "merkletreejs";
import { keccak256 } from "js-sha3";
import { allowlist } from "./allowlist";
import { ethers } from "ethers";

async function main() {
  const leafNodes = allowlist.map(address => ethers.utils.keccak256(address));
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

  if (leafNodes.length !== allowlist.length) {
    throw new Error("should have a proof for every address");
  }

  const addressesToProofs: { [key: string]: string[] } = {};
  for (let i = 0; i < leafNodes.length; i++) {
    addressesToProofs[allowlist[i]] = merkleTree.getHexProof(leafNodes[i]);
  }

  // console.log(`allow list merkle root: ${merkleTree.getRoot()}`);
  // console.log(`allow list merkle root: ${Buffer.from(merkleTree.getRoot().toString("hex"), "hex")}`);
  console.log(`allow list merkle root: ${merkleTree.getRoot().toString("hex")}`);
  console.log(`addresses to proofs map: ${JSON.stringify(addressesToProofs, null, 2)}`);
}

// This pattern is recommended to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
