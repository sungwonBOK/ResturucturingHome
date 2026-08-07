import { supabase } from '../../services/supabase';
import { createRecommendationService } from './recommendationService';

export const recommendationService = createRecommendationService({
  async invoke(name, options) {
    const { data, error } = await supabase.functions.invoke(name, { body: options.body });

    return {
      data,
      error: error ? { message: error.message } : null,
    };
  },
});
