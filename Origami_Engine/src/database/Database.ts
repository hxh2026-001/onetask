export interface OrigamiModel {
  id: number;
  name: string;
  description: string;
  vertices: string;
  creases: string;
  angles: string;
  preset_type: string;
}

export interface Vertex {
  id: number;
  x: number;
  y: number;
  z: number;
  angle: number;
}

export interface Crease {
  id: number;
  start_vertex: number;
  end_vertex: number;
  fold_angle: number;
  type: 'mountain' | 'valley' | 'flat';
}

export class OrigamiDatabase {
  private models: OrigamiModel[] = [];
  private nextId = 1;

  async init() {
    console.log('Origami database initialized (in-memory storage)');
  }

  async saveModel(model: Omit<OrigamiModel, 'id'>): Promise<number> {
    const newModel: OrigamiModel = {
      ...model,
      id: this.nextId++
    };
    this.models.push(newModel);
    console.log(`Model saved: ${model.name} (ID: ${newModel.id})`);
    return newModel.id;
  }

  async getModelById(id: number): Promise<OrigamiModel | null> {
    return this.models.find(m => m.id === id) || null;
  }

  async getModelByPresetType(presetType: string): Promise<OrigamiModel | null> {
    return this.models.find(m => m.preset_type === presetType) || null;
  }

  async getAllModels(): Promise<OrigamiModel[]> {
    return [...this.models];
  }

  async deleteModel(id: number): Promise<void> {
    this.models = this.models.filter(m => m.id !== id);
  }
}