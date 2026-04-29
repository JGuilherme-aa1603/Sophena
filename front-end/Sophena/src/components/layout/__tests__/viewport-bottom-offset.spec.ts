import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getViewportBottomOffset } from '../viewport-bottom-offset'

describe('getViewportBottomOffset', () => {
  const originalInnerWidth = window.innerWidth
  const originalInnerHeight = window.innerHeight
  const originalVisualViewport = window.visualViewport

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: originalInnerWidth,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: originalVisualViewport,
    })
  })

  it('retorna zero fora do layout mobile quando não há viewport visual disponível', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: undefined,
    })

    expect(getViewportBottomOffset()).toBe(0)
  })

  it('mantém uma folga mínima no mobile mesmo quando o navegador não expõe viewport visual', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 390,
    })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: undefined,
    })

    expect(getViewportBottomOffset()).toBe(64)
  })

  it('retorna zero em larguras de desktop mesmo com diferença de viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 900,
    })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        height: 820,
        offsetTop: 0,
      },
    })

    expect(getViewportBottomOffset()).toBe(0)
  })

  it('retorna a maior folga no mobile quando a viewport útil fica menor que o esperado', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 390,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 844,
    })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        height: 760,
        offsetTop: 0,
      },
    })

    expect(getViewportBottomOffset()).toBe(84)
  })

  it('mantém a folga mínima quando a viewport visual ocupa toda a tela', () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 390,
    })
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 844,
    })
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        height: 900,
        offsetTop: 0,
      },
    })

    expect(getViewportBottomOffset()).toBe(64)
  })
})
