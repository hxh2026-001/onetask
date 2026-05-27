const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3018;

app.use(cors());
app.use(bodyParser.json());

const SCENES_DIR = path.join(__dirname, 'scenes');
if (!fs.existsSync(SCENES_DIR)) {
  fs.mkdirSync(SCENES_DIR);
}

const presets = {
  preset1: {
    name: "预设一：反射无限递归",
    description: "递归深度过深导致调用栈溢出",
    scene: {
      objects: [
        {
          type: "sphere",
          position: [0, 0, 0],
          radius: 1,
          material: {
            type: "mirror",
            color: [0.9, 0.9, 0.9],
            reflectivity: 1.0
          }
        },
        {
          type: "sphere",
          position: [3, 0, 0],
          radius: 1,
          material: {
            type: "mirror",
            color: [0.9, 0.2, 0.2],
            reflectivity: 1.0
          }
        },
        {
          type: "sphere",
          position: [-3, 0, 0],
          radius: 1,
          material: {
            type: "mirror",
            color: [0.2, 0.9, 0.2],
            reflectivity: 1.0
          }
        },
        {
          type: "plane",
          position: [0, -1.5, 0],
          normal: [0, 1, 0],
          material: {
            type: "lambertian",
            color: [0.3, 0.3, 0.3]
          }
        }
      ],
      lights: [
        {
          type: "point",
          position: [0, 5, 5],
          color: [1, 1, 1],
          intensity: 20
        }
      ],
      camera: {
        position: [0, 0, 8],
        lookAt: [0, 0, 0],
        fov: 60
      },
      settings: {
        maxDepth: 20,
        samples: 1,
        enableBVH: true
      }
    }
  },
  preset2: {
    name: "预设二：折射全内反射",
    description: "玻璃材质的全内反射效果",
    scene: {
      objects: [
        {
          type: "sphere",
          position: [0, 0, 0],
          radius: 1.5,
          material: {
            type: "glass",
            color: [0.8, 0.9, 1.0],
            ior: 1.5
          }
        },
        {
          type: "plane",
          position: [0, -1.5, 0],
          normal: [0, 1, 0],
          material: {
            type: "lambertian",
            color: [0.2, 0.4, 0.8]
          }
        },
        {
          type: "sphere",
          position: [-3, -1, 0],
          radius: 0.8,
          material: {
            type: "lambertian",
            color: [0.9, 0.3, 0.3]
          }
        },
        {
          type: "sphere",
          position: [3, -1, 0],
          radius: 0.8,
          material: {
            type: "lambertian",
            color: [0.3, 0.9, 0.3]
          }
        }
      ],
      lights: [
        {
          type: "point",
          position: [5, 5, 5],
          color: [1, 1, 1],
          intensity: 30
        },
        {
          type: "point",
          position: [-5, 5, 5],
          color: [0.8, 0.8, 1.0],
          intensity: 20
        }
      ],
      camera: {
        position: [0, 2, 8],
        lookAt: [0, 0, 0],
        fov: 50
      },
      settings: {
        maxDepth: 20,
        samples: 32,
        enableBVH: true
      }
    }
  },
  preset3: {
    name: "预设三：软阴影噪点",
    description: "低采样数下的软阴影噪点",
    scene: {
      objects: [
        {
          type: "sphere",
          position: [0, 0, 0],
          radius: 1,
          material: {
            type: "lambertian",
            color: [0.8, 0.2, 0.2]
          }
        },
        {
          type: "plane",
          position: [0, -1, 0],
          normal: [0, 1, 0],
          material: {
            type: "lambertian",
            color: [0.4, 0.4, 0.4]
          }
        },
        {
          type: "cube",
          position: [3, 0, 0],
          size: 1.5,
          material: {
            type: "lambertian",
            color: [0.2, 0.8, 0.2]
          }
        }
      ],
      lights: [
        {
          type: "area",
          position: [0, 5, 5],
          size: 2,
          color: [1, 1, 1],
          intensity: 50
        }
      ],
      camera: {
        position: [0, 3, 8],
        lookAt: [0, 0, 0],
        fov: 50
      },
      settings: {
        maxDepth: 5,
        samples: 4,
        enableBVH: true
      }
    }
  },
  preset4: {
    name: "预设四：BVH 树失衡",
    description: "BVH 树结构失衡导致性能下降",
    scene: {
      objects: [],
      lights: [
        {
          type: "point",
          position: [0, 10, 10],
          color: [1, 1, 1],
          intensity: 100
        }
      ],
      camera: {
        position: [0, 5, 15],
        lookAt: [0, 0, 0],
        fov: 45
      },
      settings: {
        maxDepth: 3,
        samples: 16,
        enableBVH: true,
        unbalancedBVH: true
      }
    }
  }
};

for (let i = 0; i < 100; i++) {
  presets.preset4.scene.objects.push({
    type: "sphere",
    position: [
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    ],
    radius: 0.1 + Math.random() * 0.3,
    material: {
      type: "lambertian",
      color: [
        Math.random(),
        Math.random(),
        Math.random()
      ]
    }
  });
}

let currentScene = {
  objects: [
    {
      type: "sphere",
      position: [0, 0, 0],
      radius: 1,
      material: {
        type: "lambertian",
        color: [0.8, 0.3, 0.3]
      }
    }
  ],
  lights: [
    {
      type: "point",
      position: [0, 5, 5],
      color: [1, 1, 1],
      intensity: 20
    }
  ],
  camera: {
    position: [0, 0, 5],
    lookAt: [0, 0, 0],
    fov: 60
  },
  settings: {
    maxDepth: 5,
    samples: 16,
    enableBVH: true
  }
};

app.get('/api/scene', (req, res) => {
  res.json(currentScene);
});

app.put('/api/scene', (req, res) => {
  currentScene = req.body;
  res.json({ success: true });
});

app.get('/api/presets', (req, res) => {
  res.json(presets);
});

app.get('/api/preset/:id', (req, res) => {
  const preset = presets[req.params.id];
  if (preset) {
    currentScene = preset.scene;
    res.json(preset);
  } else {
    res.status(404).json({ error: 'Preset not found' });
  }
});

app.post('/api/scene/save', (req, res) => {
  const filename = req.body.filename || 'scene.json';
  const filepath = path.join(SCENES_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(currentScene, null, 2));
  res.json({ success: true, filepath });
});

app.get('/api/scene/load/:filename', (req, res) => {
  const filepath = path.join(SCENES_DIR, req.params.filename);
  if (fs.existsSync(filepath)) {
    currentScene = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    res.json(currentScene);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
