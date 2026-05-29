import express from 'express'
import cors from 'cors'
import { createServer } from 'http'

const app = express()
const server = createServer(app)

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.static('public'))

import { polygonClipping, voronoiGenerator } from './geometry.js'

app.post('/api/clipped-polygon', (req, res) => {
  try {
    const { subject, clip } = req.body
    const result = polygonClipping(subject, clip)
    res.json({ success: true, result })
  } catch (error) {
    res.json({ success: false, error: error.message })
  }
})

app.post('/api/voronoi', (req, res) => {
  try {
    const { points, bounds } = req.body
    const result = voronoiGenerator(points, bounds)
    res.json({ success: true, result })
  } catch (error) {
    res.json({ success: false, error: error.message })
  }
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
