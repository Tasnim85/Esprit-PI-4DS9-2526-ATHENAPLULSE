/**
 * Patches model.glb to put arms in A-pose (down along body).
 * Modifies bone rotations directly in the GLB JSON chunk.
 * Run: node patch-model.js
 */
const fs = require('fs');
const path = require('path');

const INPUT  = path.join(__dirname, 'public/model.glb');
const OUTPUT = path.join(__dirname, 'public/model.glb');
const BACKUP = path.join(__dirname, 'public/model_tpose_backup.glb');

// Backup original if not already done
if (!fs.existsSync(BACKUP)) {
  fs.copyFileSync(INPUT, BACKUP);
  console.log('Backed up original to model_tpose_backup.glb');
}

const buf = fs.readFileSync(INPUT);

// Parse GLB
const chunk0Length = buf.readUInt32LE(12);
const jsonBytes    = buf.slice(20, 20 + chunk0Length);
const gltf         = JSON.parse(jsonBytes.toString('utf8'));

// THREE.Quaternion.setFromEuler equivalent (XYZ order)
function eulerToQuat(x, y, z) {
  const c1 = Math.cos(x/2), s1 = Math.sin(x/2);
  const c2 = Math.cos(y/2), s2 = Math.sin(y/2);
  const c3 = Math.cos(z/2), s3 = Math.sin(z/2);
  return [
    s1*c2*c3 + c1*s2*s3,  // x
    c1*s2*c3 - s1*c2*s3,  // y
    c1*c2*s3 + s1*s2*c3,  // z
    c1*c2*c3 - s1*s2*s3,  // w
  ];
}

// Target A-pose rotations (Euler XYZ → Quaternion)
// These bring arms from T-pose (horizontal) to A-pose (down along body)
const POSE = {
  LeftShoulder:  eulerToQuat(0,      0,     -0.30),
  RightShoulder: eulerToQuat(0,      0,      0.30),
  LeftArm:       eulerToQuat(0.05,   0,     -1.45),
  RightArm:      eulerToQuat(0.05,   0,      1.45),
  LeftForeArm:   eulerToQuat(0,     -0.10,   0   ),
  RightForeArm:  eulerToQuat(0,      0.10,   0   ),
  LeftHand:      eulerToQuat(0.05,   0,      0   ),
  RightHand:     eulerToQuat(0.05,   0,      0   ),
};

let changed = 0;
gltf.nodes.forEach((node) => {
  if (POSE[node.name]) {
    const old = JSON.stringify(node.rotation);
    node.rotation = POSE[node.name];
    console.log(`${node.name}: ${old} → ${JSON.stringify(node.rotation)}`);
    changed++;
  }
});

console.log(`\nModified ${changed} bones.`);

// Re-serialize JSON chunk (must be padded to 4-byte boundary with spaces)
let newJson = JSON.stringify(gltf);
while (newJson.length % 4 !== 0) newJson += ' ';
const newJsonBuf = Buffer.from(newJson, 'utf8');

// Rebuild GLB
const header      = Buffer.alloc(12);
const chunk0Header = Buffer.alloc(8);
const chunk1Start  = 20 + chunk0Length;
const chunk1Data   = buf.slice(chunk1Start); // binary chunk unchanged

const newTotalLength = 12 + 8 + newJsonBuf.length + chunk1Data.length;

header.writeUInt32LE(0x46546C67, 0); // magic 'glTF'
header.writeUInt32LE(2, 4);           // version
header.writeUInt32LE(newTotalLength, 8);

chunk0Header.writeUInt32LE(newJsonBuf.length, 0);
chunk0Header.writeUInt32LE(0x4E4F534A, 4); // 'JSON'

const output = Buffer.concat([header, chunk0Header, newJsonBuf, chunk1Data]);
fs.writeFileSync(OUTPUT, output);
console.log(`\nWrote patched GLB (${output.length} bytes) to ${OUTPUT}`);
