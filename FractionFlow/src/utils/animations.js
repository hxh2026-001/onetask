export const animateNumber = (start, end, duration = 800, callback) => {
  const startTime = performance.now();
  const diff = end - start;
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(start + diff * easeOutQuart);
    
    callback(current, progress);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      callback(end, 1);
    }
  };
  
  requestAnimationFrame(animate);
};

export const animateProgress = (duration = 1200, callback) => {
  const startTime = performance.now();
  
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeInOutCubic = progress < 0.5 
      ? 4 * progress * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    callback(easeInOutCubic);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

export const triggerErrorFlash = (elementId, times = 3) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  let count = 0;
  const flash = () => {
    element.classList.add('error-flash');
    setTimeout(() => {
      element.classList.remove('error-flash');
      count++;
      if (count < times) {
        setTimeout(flash, 150);
      }
    }, 150);
  };
  flash();
};

export const triggerMergeAnimation = (sourceElementId, targetElementId, onComplete) => {
  const source = document.getElementById(sourceElementId);
  const target = document.getElementById(targetElementId);
  
  if (!source || !target) {
    if (onComplete) onComplete();
    return;
  }
  
  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  
  const clone = source.cloneNode(true);
  clone.id = 'merge-clone';
  clone.style.position = 'fixed';
  clone.style.left = `${sourceRect.left}px`;
  clone.style.top = `${sourceRect.top}px`;
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;
  clone.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
  clone.style.zIndex = '1000';
  clone.style.pointerEvents = 'none';
  
  document.body.appendChild(clone);
  
  requestAnimationFrame(() => {
    clone.style.left = `${targetRect.left + targetRect.width / 2 - sourceRect.width / 2}px`;
    clone.style.top = `${targetRect.top + targetRect.height / 2 - sourceRect.height / 2}px`;
    clone.style.transform = 'scale(0.8)';
    clone.style.opacity = '0.6';
  });
  
  setTimeout(() => {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
    target.classList.add('merge-pulse');
    setTimeout(() => {
      target.classList.remove('merge-pulse');
      if (onComplete) onComplete();
    }, 400);
  }, 600);
};

export const triggerSliceDropAnimation = (element) => {
  if (!element) return;
  element.classList.add('slice-drop');
  setTimeout(() => {
    element.classList.remove('slice-drop');
  }, 500);
};

export const triggerResultReveal = (elementId, delay = 300) => {
  setTimeout(() => {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('result-reveal');
    }
  }, delay);
};

export const triggerGlitchEffect = (elementId, duration = 2000) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.classList.add('glitch-active');
  
  const interval = setInterval(() => {
    if (Math.random() > 0.5) {
      element.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`;
    } else {
      element.style.transform = '';
    }
  }, 50);
  
  setTimeout(() => {
    clearInterval(interval);
    element.classList.remove('glitch-active');
    element.style.transform = '';
  }, duration);
};

export const triggerNaNRender = (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.innerHTML = '<span class="nan-text">NaN</span>';
  element.classList.add('nan-render');
  triggerGlitchEffect(elementId, 3000);
};

export const triggerLayoutBreak = (containerId, duration = 3000) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.classList.add('layout-break');
  
  const children = container.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    child.style.position = 'relative';
    child.style.transition = 'transform 0.3s ease';
    setInterval(() => {
      if (container.classList.contains('layout-break')) {
        child.style.transform = `rotate(${Math.random() * 20 - 10}deg) translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px)`;
      }
    }, 200 + i * 50);
  }
  
  setTimeout(() => {
    container.classList.remove('layout-break');
    for (let i = 0; i < children.length; i++) {
      children[i].style.transform = '';
    }
  }, duration);
};

export const triggerOverflowVisual = (elementId, value) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  element.classList.add('overflow-visual');
  element.innerHTML = `
    <div class="overflow-container">
      <span class="overflow-value">${value}</span>
      <span class="overflow-warning">⚠️ 数值溢出</span>
    </div>
  `;
  
  triggerGlitchEffect(elementId, 2500);
};

export const triggerInfiniteLoopVisual = (elementId, iterations = 20) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  let count = 0;
  const values = ['∞', '♾️', '...', '↻', '⟳'];
  
  const loop = () => {
    if (count < iterations) {
      element.textContent = values[count % values.length];
      element.style.color = `hsl(${(count * 30) % 360}, 70%, 50%)`;
      count++;
      setTimeout(loop, 100);
    } else {
      element.textContent = '⚠️ 死循环';
      element.classList.add('error-flash');
    }
  };
  
  loop();
};
