import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

async function main() {
  const projectRoot = process.cwd()
  const svgPath = path.join(projectRoot, 'public', 'favicon.svg')
  const outDir = path.join(projectRoot, 'public')
  const sizes = [32, 64, 128, 256, 512, 1024]

  const svg = await fs.readFile(svgPath)

  await fs.mkdir(outDir, { recursive: true })

  for (const size of sizes) {
    const outPath = path.join(outDir, `logo-${size}.png`)
    const img = sharp(svg, { density: 384 }) // high density for crisp rasterization
      .resize(size, size, { fit: 'cover' })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
    await img.toFile(outPath)
    console.log(`✅ wrote ${path.relative(projectRoot, outPath)}`)
  }
}

main().catch((err) => {
  console.error('Export failed:', err)
  process.exitCode = 1
})

