// Copie dans web/vendor les fichiers de three.js dont la page a besoin (electron-builder écarte les dossiers « examples »).
const fs = require('node:fs')
const path = require('node:path')
const src = path.join(__dirname, '..', 'node_modules', 'three')
const dst = path.join(__dirname, '..', 'web', 'vendor', 'three')
const files = ['build/three.module.js', 'build/three.core.js', 'examples/jsm/loaders/GLTFLoader.js', 'examples/jsm/utils/BufferGeometryUtils.js']
for (const f of files) {
  const from = path.join(src, f)
  if (!fs.existsSync(from)) { console.log('absent (normal selon la version) :', f); continue }
  fs.mkdirSync(path.dirname(path.join(dst, f)), { recursive: true })
  fs.copyFileSync(from, path.join(dst, f))
  console.log('copié :', f)
}
