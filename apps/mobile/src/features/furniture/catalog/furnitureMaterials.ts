interface SurfaceColors {
  edge: string;
  top: string;
  bottom: string;
  outline: string;
  cushion: string;
  accent: string;
  trim: string;
  glass: string;
}

export const furnitureMaterials = {
  naturalOak: {
    edge: '#66452F', top: '#D6A775', bottom: '#A87349', outline: '#E5C9A8',
    cushion: '#E1B98B', accent: '#F0D5B6', trim: '#775035', glass: '#465864',
  },
  walnut: {
    edge: '#3F2921', top: '#AF7E5C', bottom: '#80523C', outline: '#D2A47F',
    cushion: '#BC9472', accent: '#D9B394', trim: '#5A3C31', glass: '#3F515F',
  },
  wovenFabric: {
    edge: '#474239', top: '#AC9B87', bottom: '#786C5E', outline: '#D1BD9F',
    cushion: '#C6B6A1', accent: '#E3D2BD', trim: '#8F7F6B', glass: '#596571',
  },
  sageFabric: {
    edge: '#344A40', top: '#779484', bottom: '#506B5E', outline: '#B1C8B1',
    cushion: '#9EB7A6', accent: '#C1D1B7', trim: '#506B5E', glass: '#394D51',
  },
  ivoryLinen: {
    edge: '#695547', top: '#D4C5B4', bottom: '#A9927F', outline: '#E6D3BD',
    cushion: '#F4E6D3', accent: '#CF8F75', trim: '#916B50', glass: '#59616B',
  },
  whiteMetal: {
    edge: '#4F5E6E', top: '#DDE3E7', bottom: '#A0AEBA', outline: '#D9E3EB',
    cushion: '#E5ECF0', accent: '#C9D4DE', trim: '#627283', glass: '#405563',
  },
  slateMetal: {
    edge: '#263645', top: '#748899', bottom: '#47586A', outline: '#A7BCCB',
    cushion: '#8B9DAE', accent: '#AABCCD', trim: '#384755', glass: '#2B3D49',
  },
  warmWeave: {
    edge: '#6A4234', top: '#BD856F', bottom: '#985E4A', outline: '#D6A897',
    cushion: '#C5927C', accent: '#DDB29B', trim: '#8A5446', glass: '#565560',
  },
} satisfies Record<string, SurfaceColors>;

export type FurnitureMaterial = keyof typeof furnitureMaterials;
export type FurnitureDetailFinish = 'cushion' | 'accent' | 'trim' | 'glass';
