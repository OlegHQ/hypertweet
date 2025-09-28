import { APIClient } from './client';
import type {
  APIResponse,
  PaginatedAPIResponse,
  Tone,
  ToneFormData,
  ToneSearchCriteria,
} from './types';
import { mockTones } from '@/screens/tones/types';

const mutableMockTones = [...mockTones];

export namespace ToneAPI {
  export async function getTones(
    criteria: ToneSearchCriteria = {}
  ): Promise<PaginatedAPIResponse<Tone>> {
    // Mocked implementation
    const { query, category, tags, isFavorite, isActive, sortBy, sortOrder } =
      criteria;
    let tones = [...mutableMockTones];

    if (query) {
      tones = tones.filter(
        t =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    if (category) {
      tones = tones.filter(t => t.category === category);
    }
    if (tags && tags.length > 0) {
      tones = tones.filter(t => t.tags.some(tag => tags.includes(tag)));
    }
    if (isFavorite !== undefined) {
      tones = tones.filter(t => t.isFavorite === isFavorite);
    }
    if (isActive !== undefined) {
      tones = tones.filter(t => t.isActive === isActive);
    }

    if (sortBy) {
      tones.sort((a, b) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

        if (sortBy === 'lastUsed') {
          aValue = a.stats.lastUsed ?? 0;
          bValue = b.stats.lastUsed ?? 0;
        } else if (sortBy === 'usage') {
          aValue = a.stats.totalUses;
          bValue = b.stats.totalUses;
        } else if (sortBy === 'engagement') {
          aValue = a.stats.averageEngagement;
          bValue = b.stats.averageEngagement;
        } else {
          aValue = a[sortBy];
          bValue = b[sortBy];
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return Promise.resolve({
      success: true,
      statusCode: 200,
      data: tones,
      pagination: {
        page: 1,
        limit: 10,
        total: tones.length,
        hasNext: false,
        hasPrevious: false,
      },
      headers: {},
    });
  }

  export async function createTone(
    data: ToneFormData
  ): Promise<APIResponse<Tone>> {
    // Mocked implementation
    const newTone: Tone = {
      id: String(mutableMockTones.length + 1),
      ...data,
      isDefault: false,
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user',
      stats: {
        totalUses: 0,
        successRate: 0,
        averageEngagement: 0,
        responseTime: 0,
      },
    };
    mutableMockTones.push(newTone);
    return Promise.resolve({
      success: true,
      statusCode: 201,
      data: newTone,
      headers: {},
    });
  }

  export async function updateTone(
    id: string,
    data: Partial<ToneFormData>
  ): Promise<APIResponse<Tone>> {
    // Mocked implementation
    const toneIndex = mutableMockTones.findIndex(t => t.id === id);
    if (toneIndex === -1) {
      return Promise.resolve({
        success: false,
        statusCode: 404,
        error: 'Tone not found',
        headers: {},
      });
    }
    const updatedTone = {
      ...mutableMockTones[toneIndex],
      ...data,
      updatedAt: new Date(),
    };
    mutableMockTones[toneIndex] = updatedTone;
    return Promise.resolve({
      success: true,
      statusCode: 200,
      data: updatedTone,
      headers: {},
    });
  }

  export async function deleteTone(id: string): Promise<APIResponse<void>> {
    // Mocked implementation
    const toneIndex = mutableMockTones.findIndex(t => t.id === id);
    if (toneIndex === -1) {
      return Promise.resolve({
        success: false,
        statusCode: 404,
        error: 'Tone not found',
        headers: {},
      });
    }
    mutableMockTones.splice(toneIndex, 1);
    return Promise.resolve({ success: true, statusCode: 204, headers: {} });
  }

  export async function favoriteTone(
    id: string,
    isFavorite: boolean
  ): Promise<APIResponse<Tone>> {
    // Mocked implementation
    const toneIndex = mutableMockTones.findIndex(t => t.id === id);
    if (toneIndex === -1) {
      return Promise.resolve({
        success: false,
        statusCode: 404,
        error: 'Tone not found',
        headers: {},
      });
    }
    const updatedTone = {
      ...mutableMockTones[toneIndex],
      isFavorite,
      updatedAt: new Date(),
    };
    mutableMockTones[toneIndex] = updatedTone;
    return Promise.resolve({
      success: true,
      statusCode: 200,
      data: updatedTone,
      headers: {},
    });
  }
}
