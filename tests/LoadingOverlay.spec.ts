import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import LoadingOverlay from '@/components/LoadingOverlay.vue';

describe('LoadingOverlay', () => {
  it('показывает спиннер и текст загрузки по умолчанию', () => {
    const wrapper = mount(LoadingOverlay);

    expect(wrapper.find('.loading-overlay__spinner').exists()).toBe(true);
    expect(wrapper.find('.loading-overlay__message').text()).toBe('Загрузка данных…');
  });

  it('принимает текст через параметры оверлея', () => {
    const wrapper = mount(LoadingOverlay, { props: { params: { loadingMessage: 'Подождите…' } } });

    expect(wrapper.find('.loading-overlay__message').text()).toBe('Подождите…');
  });
});
