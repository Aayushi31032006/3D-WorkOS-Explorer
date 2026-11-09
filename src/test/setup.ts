import '@testing-library/jest-dom';

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
});

// Mock ResizeObserver
(globalThis as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock HTMLCanvasElement getContext
HTMLCanvasElement.prototype.getContext = function (contextType: string) {
  if (contextType === 'webgl' || contextType === 'experimental-webgl') {
    return {
      getExtension: () => null,
      getParameter: () => 0,
      createTexture: () => ({}),
      bindTexture: () => {},
      texParameteri: () => {},
      texImage2D: () => {},
      clearColor: () => {},
      clearDepth: () => {},
      clear: () => {},
      enable: () => {},
      disable: () => {},
      viewport: () => {},
      createShader: () => ({}),
      shaderSource: () => {},
      compileShader: () => {},
      getShaderParameter: () => true,
      createProgram: () => ({}),
      attachShader: () => {},
      linkProgram: () => {},
      getProgramParameter: () => true,
      useProgram: () => {}
    } as any;
  }
  return null;
} as any;
